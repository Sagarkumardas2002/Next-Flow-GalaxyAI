/*
  Warnings:

  - Added the required column `nodeCount` to the `WorkflowRun` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `WorkflowRun` table without a default value. This is not possible if the table is not empty.
  - Added the required column `workflowName` to the `WorkflowRun` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "WorkflowRun" ADD COLUMN     "nodeCount" INTEGER NOT NULL,
ADD COLUMN     "type" TEXT NOT NULL,
ADD COLUMN     "workflowName" TEXT NOT NULL;
