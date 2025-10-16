CREATE TABLE "custom_agent" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"system_prompt" text NOT NULL,
	"visibility" varchar DEFAULT 'private' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "custom_agent" ADD CONSTRAINT "custom_agent_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

CREATE TABLE "agent_knowledge_file" (
	"id" text PRIMARY KEY NOT NULL,
	"agent_id" text NOT NULL,
	"title" text NOT NULL,
	"blob_url" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agent_knowledge_file" ADD CONSTRAINT "agent_knowledge_file_agent_id_custom_agent_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."custom_agent"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

CREATE TABLE "agent_execution" (
	"id" text PRIMARY KEY NOT NULL,
	"agent_id" text NOT NULL,
	"user_id" text NOT NULL,
	"chat_id" text,
	"input" json,
	"output_summary" text,
	"tokens" integer DEFAULT 0,
	"duration_ms" integer,
	"status" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agent_execution" ADD CONSTRAINT "agent_execution_agent_id_custom_agent_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."custom_agent"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "agent_execution" ADD CONSTRAINT "agent_execution_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "agent_execution" ADD CONSTRAINT "agent_execution_chat_id_chat_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chat"("id") ON DELETE no action ON UPDATE no action;