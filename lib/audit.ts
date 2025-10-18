import { db } from '@/lib/db';
import { auditLog } from '@/lib/db/schema';
import { generateId } from 'ai';

export async function createAuditLog(input: {
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  const id = generateId();
  const values = {
    id,
    userId: input.userId,
    action: input.action,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    metadata: input.metadata ?? null,
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
    createdAt: new Date(),
  } as any;
  await db.insert(auditLog).values(values);
  return id;
}