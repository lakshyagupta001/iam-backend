-- AlterTable
ALTER TABLE "Alert" ADD COLUMN     "acknowledgedAt" TIMESTAMP(3),
ADD COLUMN     "isAcknowledged" BOOLEAN NOT NULL DEFAULT false;
