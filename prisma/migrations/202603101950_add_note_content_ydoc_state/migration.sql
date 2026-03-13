-- Add persisted note body state for autosave.
ALTER TABLE "Note" ADD COLUMN "contentYdocState" TEXT;
