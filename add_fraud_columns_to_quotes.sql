-- SQL to add missing fraud detection columns to the 'quotes' table

ALTER TABLE "quotes"
ADD COLUMN "fraud_status" varchar(50) DEFAULT 'ok',
ADD COLUMN "fraud_score" integer,
ADD COLUMN "fraud_details" json,
ADD COLUMN "fraud_checked_at" timestamp,
ADD COLUMN "fraud_note" text;
