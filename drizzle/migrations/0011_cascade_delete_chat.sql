ALTER TABLE "chat" DROP CONSTRAINT IF EXISTS "chat_userId_fkey";
--> statement-breakpoint
ALTER TABLE "chat" ADD CONSTRAINT "chat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
