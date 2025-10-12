// Edge-safe session verification (no Node.js crypto)
import { serverEnv } from '@/env/server';

const SECRET = serverEnv.LOCAL_AUTH_SECRET || 'insecure-local-secret';
const enc = new TextEncoder();

function toBase64Url(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  const b64 = btoa(binary);
  return b64.replace(/=+$/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function fromBase64UrlToString(b64url: string): string {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(b64url.length / 4) * 4, '=');
  const binary = atob(b64);
  return binary;
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let res = 0;
  for (let i = 0; i < a.length; i++) {
    res |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return res === 0;
}

async function sign(data: string) {
  const key = await crypto.subtle.importKey('raw', enc.encode(SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return toBase64Url(new Uint8Array(sig));
}

export async function verifySessionToken(token: string | undefined | null): Promise<{ userId: string; email?: string } | null> {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== 'v1') return null;
  const [, body, signature] = parts as [string, string, string];
  try {
    const expected = await sign(body);
    if (!timingSafeEqual(signature, expected)) return null;
  } catch {
    return null;
  }
  try {
    const json = fromBase64UrlToString(body);
    const data = JSON.parse(json);
    if (!data?.userId) return null;
    return { userId: data.userId as string, email: data.email as string | undefined };
  } catch {
    return null;
  }
}
