-- DropForeignKey
ALTER TABLE "public"."Gallery" DROP CONSTRAINT "Gallery_projectId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ProjectImage" DROP CONSTRAINT "ProjectImage_projectId_fkey";

-- AddForeignKey
ALTER TABLE "ProjectImage" ADD CONSTRAINT "ProjectImage_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gallery" ADD CONSTRAINT "Gallery_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
