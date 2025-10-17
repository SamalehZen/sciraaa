import { db } from '@/lib/db';
import { auditLog } from '@/lib/db/schema';

export type AuditAction =
  | 'RESET_PASSWORD'
  | 'SUSPEND'
  | 'UNSUSPEND'
  | 'DELETE_USER'
  | 'LOGIN'
  | 'LOGOUT'
  | 'LOGIN_FAILED'
  | 'UPDATE_PREFS';

export async function logAudit(params: {
  actorUsername: string;
  actorRole: string;
  targetUsername?: string | null;
  action: AuditAction;
  metadata?: any;
  ip?: string | null;
  userAgent?: string | null;
}) {
  const { actorUsername, actorRole, targetUsername, action, metadata, ip, userAgent } = params;
  await db.insert(auditLog).values({
    actorUsername,
    actorRole,
    targetUsername: targetUsername ?? null,
    action,
    metadata: metadata ?? null,
    ip: ip ?? null,
    userAgent: userAgent ?? null,
  });
}
