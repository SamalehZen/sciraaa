import { cookies } from 'next/headers';
import { serverEnv } from '@/env/server';

const COOKIE_NAME = 'local.session';
const SECRET = serverEnv.LOCAL_AUTH_SECRET || 'insecure-local-secret';
const MAX_AGE_DAYS = parseInt(process.env.LOCAL_SESSION_MAX_AGE_DAYS || '30', 10);

const enc = new TextEncoder();

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function base64Encode(bytes: Uint8Array): string {
  let out = '';
  let i = 0;
  const len = bytes.length;
  for (; i + 2 < len; i += 3) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
    out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63] + B64[(n >> 6) & 63] + B64[n & 63];
  }
  const rem = len - i;
  if (rem === 1) {
    const n = bytes[i] << 16;
    out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63] + '==';
  } else if (rem === 2) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8);
    out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63] + B64[(n >> 6) & 63] + '=';
  }
  return out;
}

function base64DecodeToBytes(b64: string): Uint8Array {
  const clean = b64.replace(/[^A-Za-z0-9+/=]/g, '');
  if (clean.length % 4 === 1) throw new Error('Invalid base64');
  const pad = clean.endsWith('==') ? 2 : clean.endsWith('=') ? 1 : 0;
  const outLen = (clean.length / 4) * 3 - pad;
  const out = new Uint8Array(outLen);
  let p = 0;
  function idx(ch: string): number {
    if (ch === '=') return 0;
    const i = B64.indexOf(ch);
    if (i === -1) throw new Error('Invalid base64 char');
    return i;
  }
  for (let i = 0; i < clean.length; i += 4) {
    const n = (idx(clean[i]) << 18) | (idx(clean[i + 1]) << 12) | (idx(clean[i + 2]) << 6) | idx(clean[i + 3]);
    out[p++] = (n >> 16) & 255;
    if (clean[i + 2] !== '=') out[p++] = (n >> 8) & 255;
    if (clean[i + 3] !== '=') out[p++] = n & 255;
  }
  return out;
}

function base64urlEncode(bytes: Uint8Array): string {
  const b64 = base64Encode(bytes);
  return b64.replace(/=+$/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64urlDecodeToBytes(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (b64.length % 4 || 4)) % 4;
  const padded = b64 + '='.repeat(padLen);
  return base64DecodeToBytes(padded);
}

async function hmacSign(keyUtf8: string, dataUtf8: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(keyUtf8),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(dataUtf8));
  return new Uint8Array(sig);
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function createSessionToken(payload: { userId: string; email?: string }): Promise<string> {
  const json = JSON.stringify({ ...payload, iat: Date.now() });
  const body = base64urlEncode(enc.encode(json));
  const signatureBytes = await hmacSign(SECRET, body);
  const signature = base64urlEncode(signatureBytes);
  return `v1.${body}.${signature}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<{ userId: string; email?: string } | null> {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== 'v1') return null;
  const [_, body, signature] = parts as [string, string, string];
  try {
    const expectedBytes = await hmacSign(SECRET, body);
    const providedBytes = base64urlDecodeToBytes(signature);
    if (!timingSafeEqual(providedBytes, expectedBytes)) return null;
  } catch {
    return null;
  }
  try {
    const bytes = base64urlDecodeToBytes(body);
    const json = new TextDecoder().decode(bytes);
    const data = JSON.parse(json);
    if (!data?.userId) return null;
    return { userId: data.userId as string, email: data.email as string | undefined };
  } catch {
    return null;
  }
}

export async function getSessionFromHeaders(hdrs: Headers): Promise<{ userId: string; email?: string } | null> {
  const cookieHeader = hdrs.get('cookie') || '';
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  const token = match ? decodeURIComponent(match[1]) : null;
  return await verifySessionToken(token);
}

export async function getSessionFromRequestCookies(): Promise<{ userId: string; email?: string } | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return await verifySessionToken(token || null);
}

export function createCookie(token: string) {
  const maxAge = MAX_AGE_DAYS * 24 * 60 * 60; // seconds
  const expires = new Date(Date.now() + maxAge * 1000);
  return {
    name: COOKIE_NAME,
    value: token,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      expires,
      maxAge,
    },
  };
}

export function clearCookie() {
  return {
    name: COOKIE_NAME,
    value: '',
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      expires: new Date(0),
      maxAge: 0,
    },
  };
}
