-- Create enums
CREATE TYPE "UserRole" AS ENUM ('admin', 'ops_manager', 'sales_agent', 'viewer');
CREATE TYPE "PlannerSessionStatus" AS ENUM ('active', 'handed_off', 'closed');
CREATE TYPE "MessageRole" AS ENUM ('user', 'assistant', 'system');
CREATE TYPE "InquiryStatus" AS ENUM ('pending', 'triaged', 'replied', 'closed');
CREATE TYPE "Priority" AS ENUM ('High', 'Medium', 'Low');
CREATE TYPE "RunStatus" AS ENUM ('queued', 'running', 'completed', 'failed');
CREATE TYPE "AIFeature" AS ENUM ('planner', 'triage', 'pricing');
CREATE TYPE "AIRunStatus" AS ENUM ('success', 'error');

-- Tables
CREATE TABLE "User" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" TEXT NOT NULL UNIQUE,
  "name" TEXT,
  "role" "UserRole" NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "PlannerSession" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "visitorId" TEXT,
  "source" TEXT NOT NULL DEFAULT 'web',
  "status" "PlannerSessionStatus" NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "PlannerMessage" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "sessionId" UUID NOT NULL REFERENCES "PlannerSession"("id") ON DELETE CASCADE,
  "role" "MessageRole" NOT NULL,
  "content" TEXT NOT NULL,
  "provider" TEXT,
  "model" TEXT,
  "inputTokens" INTEGER,
  "outputTokens" INTEGER,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "HandoffRequest" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "sessionId" UUID NOT NULL REFERENCES "PlannerSession"("id") ON DELETE CASCADE,
  "guestName" TEXT NOT NULL,
  "guestEmail" TEXT NOT NULL,
  "notes" TEXT,
  "itineraryText" TEXT,
  "status" TEXT NOT NULL DEFAULT 'created',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "Inquiry" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "source" TEXT NOT NULL,
  "senderName" TEXT NOT NULL,
  "senderEmail" TEXT,
  "subject" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "receivedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "unread" BOOLEAN NOT NULL DEFAULT TRUE,
  "status" "InquiryStatus" NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "TriageResult" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "inquiryId" UUID NOT NULL UNIQUE REFERENCES "Inquiry"("id") ON DELETE CASCADE,
  "priority" "Priority" NOT NULL,
  "priorityReason" TEXT,
  "tripType" TEXT,
  "duration" TEXT,
  "groupSize" TEXT,
  "budget" TEXT,
  "dates" TEXT,
  "halalRequired" BOOLEAN,
  "urgency" TEXT,
  "summary" TEXT,
  "recommendedPackage" TEXT,
  "actions" JSONB,
  "draftReply" TEXT,
  "rawModelOutput" JSONB,
  "model" TEXT,
  "createdByRunId" UUID,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "PricingRun" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "status" "RunStatus" NOT NULL DEFAULT 'queued',
  "startedAt" TIMESTAMPTZ,
  "finishedAt" TIMESTAMPTZ,
  "requestedBy" UUID REFERENCES "User"("id") ON DELETE SET NULL,
  "error" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "PricingResult" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "runId" UUID NOT NULL UNIQUE REFERENCES "PricingRun"("id") ON DELETE CASCADE,
  "summary" TEXT,
  "tours" JSONB,
  "airlines" JSONB,
  "recommendations" JSONB,
  "rawModelOutput" JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "AIRun" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "feature" "AIFeature" NOT NULL,
  "provider" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "inputTokens" INTEGER,
  "outputTokens" INTEGER,
  "latencyMs" INTEGER,
  "status" "AIRunStatus" NOT NULL,
  "error" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX "PlannerMessage_session_created_idx" ON "PlannerMessage"("sessionId", "createdAt");
CREATE INDEX "HandoffRequest_email_created_idx" ON "HandoffRequest"("guestEmail", "createdAt");
CREATE INDEX "Inquiry_status_received_idx" ON "Inquiry"("status", "receivedAt");
CREATE INDEX "Inquiry_sender_email_idx" ON "Inquiry"("senderEmail");
CREATE INDEX "Triage_priority_idx" ON "TriageResult"("priority");
CREATE INDEX "Triage_trip_type_idx" ON "TriageResult"("tripType");
CREATE INDEX "Triage_halal_idx" ON "TriageResult"("halalRequired");
CREATE INDEX "PricingRun_status_idx" ON "PricingRun"("status");
CREATE INDEX "PricingRun_created_idx" ON "PricingRun"("createdAt");
CREATE INDEX "AIRun_feature_created_idx" ON "AIRun"("feature", "createdAt");

CREATE UNIQUE INDEX "Inquiry_sender_email_subject_key" ON "Inquiry"("senderEmail", "subject");
