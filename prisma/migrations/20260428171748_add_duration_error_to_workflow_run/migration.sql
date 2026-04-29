-- DropForeignKey
ALTER TABLE "WorkflowRun" DROP CONSTRAINT "WorkflowRun_workflowId_fkey";

-- AlterTable
ALTER TABLE "WorkflowRun" ADD COLUMN     "duration" INTEGER,
ADD COLUMN     "errorMessage" TEXT,
ALTER COLUMN "status" SET DEFAULT 'running',
ALTER COLUMN "nodeCount" SET DEFAULT 0,
ALTER COLUMN "type" SET DEFAULT 'full';

-- AddForeignKey
ALTER TABLE "WorkflowRun" ADD CONSTRAINT "WorkflowRun_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
