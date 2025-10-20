import 'server-only';

import { and, asc, desc, eq, gt, gte, inArray, lt, type SQL } from 'drizzle-orm';
import {
  user,
  chat,
  type User,
  message,
  type Message,
  type Chat,
  stream,
  extremeSearchUsage,
  messageUsage,
  customInstructions,
  payment,
  lookout,
  userAgentAccess,
} from './schema';
import { ChatSDKError } from '../errors';
import { db, maindb } from './index';
import { getDodoPayments, setDodoPayments, getDodoProStatus, setDodoProStatus } from '../performance-cache';
import { generateId } from 'ai';

export async function getUser(email: string): Promise<Array<User>> {
  try {
    return await db.select().from(user).where(eq(user.email, email)).$withCache();
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get user by email');
  }
}

export async function getUserAgentAccess(userId: string) {
  try {
    return await db
      .select()
      .from(userAgentAccess)
      .where(eq(userAgentAccess.userId, userId))
      .orderBy(asc(userAgentAccess.agentId))
      .$withCache();
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get user agent access');
  }
}

export async function updateUserAgentAccess(userId: string, agentId: string, enabled: boolean) {
  try {
    return await db
      .insert(userAgentAccess)
      .values({ id: generateId(), userId, agentId, enabled, createdAt: new Date(), updatedAt: new Date() })
      .onConflictDoUpdate({
        target: [userAgentAccess.userId, userAgentAccess.agentId],
        set: { enabled, updatedAt: new Date() },
      })
      .returning();
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to update user agent access');
  }
}

export async function initializeUserAgentAccess(userId: string) {
  try {
    const allAgents = ['web','x','academic','youtube','reddit','stocks','chat','extreme','memory','crypto','code','connectors','cyrus','libeller','nomenclature','pdfExcel'];
    const values = allAgents.map(agentId => ({
      id: generateId(), userId, agentId, enabled: true, createdAt: new Date(), updatedAt: new Date(),
    }));
    return await db.insert(userAgentAccess).values(values).onConflictDoNothing().returning();
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to initialize user agent access');
  }
}

export async function logEvent({
  category,
  type,
  message: msg,
  metadata,
  userId,
}: {
  category: 'security' | 'user' | 'system';
  type: string;
  message?: string;
  metadata?: any;
  userId?: string;
}) {
  try {
    const { event } = await import('./schema');
    await db.insert(event).values({
      id: generateId(),
      category,
      type,
      message: msg,
      metadata,
      userId,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Error logging event:', error);
  }
}
