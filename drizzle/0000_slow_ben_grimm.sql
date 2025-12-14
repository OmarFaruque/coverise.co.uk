CREATE TABLE "admins" (
	"admin_id" serial PRIMARY KEY NOT NULL,
	"fname" varchar(255),
	"lname" varchar(255),
	"email" varchar(255),
	"phone" varchar(255),
	"password" text,
	"role" varchar(50),
	"remember_token" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admins_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "ai_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" varchar(255) NOT NULL,
	"prompt" text,
	"content" text,
	"email" varchar(255),
	"user_id" integer NOT NULL,
	"status" varchar(50) DEFAULT 'pending',
	"pdf_path" text,
	"amount" numeric,
	"currency" varchar DEFAULT 'GBP',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blacklist" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" varchar(50) NOT NULL,
	"first_name" varchar(255),
	"last_name" varchar(255),
	"email" varchar(255),
	"date_of_birth" varchar(255),
	"operator" varchar(10) DEFAULT 'AND',
	"ip_address" varchar(255),
	"postcode" varchar(50),
	"reg_number" varchar(50),
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coupons" (
	"id" serial PRIMARY KEY NOT NULL,
	"promo_code" varchar(100) NOT NULL,
	"case_sensitive" boolean DEFAULT false NOT NULL,
	"discount" json NOT NULL,
	"min_spent" varchar(50),
	"max_discount" varchar(50),
	"quota_available" varchar(50) NOT NULL,
	"used_quota" varchar(50) DEFAULT '0' NOT NULL,
	"total_usage" varchar(50) DEFAULT '0' NOT NULL,
	"expires" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"restrictions" json,
	"matches" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticket_id" integer NOT NULL,
	"message_id" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" serial PRIMARY KEY NOT NULL,
	"policy_number" varchar(255) NOT NULL,
	"user_id" varchar(255),
	"cpw" varchar(255),
	"update_price" varchar DEFAULT false,
	"reg_number" varchar(50),
	"vehicle_make" varchar(100),
	"vehicle_model" varchar(100),
	"engine_cc" varchar(50),
	"start_date" timestamp,
	"end_date" timestamp,
	"date_of_birth" timestamp,
	"first_name" varchar(100),
	"last_name" varchar(100),
	"phone" varchar(50),
	"licence_type" varchar(50),
	"licence_period" varchar(50),
	"vehicle_type" varchar(100),
	"promo_code" varchar(100),
	"payment_status" varchar(50),
	"intent_id" varchar(255),
	"spayment_id" varchar(255),
	"name_title" varchar(20),
	"vehicle_modifications" json,
	"post_code" varchar(20),
	"address" text,
	"town" varchar(100),
	"occupation" varchar(100),
	"cover_reason" varchar(255),
	"mail_sent" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"quote_data" text,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"payment_intent_id" varchar(255),
	"payment_method" varchar(50),
	"payment_date" timestamp,
	"expires_at" timestamp,
	"expiry_email_sent" boolean DEFAULT false,
	"fraud_status" varchar(50) DEFAULT 'ok',
	"fraud_score" integer,
	"fraud_details" json,
	"fraud_checked_at" timestamp,
	"fraud_note" text
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"param" text PRIMARY KEY NOT NULL,
	"value" text
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255),
	"first_name" varchar(255) NOT NULL,
	"last_name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"token" varchar(100) NOT NULL,
	"policy_number" varchar(100),
	"unread" boolean DEFAULT true NOT NULL,
	"is_closed" boolean DEFAULT false NOT NULL,
	"subject" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'open' NOT NULL,
	"priority" varchar(50) DEFAULT 'normal' NOT NULL,
	"assigned_to" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"user_id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255),
	"stripe_customer_id" varchar(255),
	"square_customer_id" varchar(255),
	"email_verified_at" timestamp with time zone,
	"password" text,
	"remember_token" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"first_name" varchar(255),
	"last_name" varchar(255),
	"verification_code_hash" text,
	"verification_code_expires_at" timestamp with time zone,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE no action ON UPDATE no action;