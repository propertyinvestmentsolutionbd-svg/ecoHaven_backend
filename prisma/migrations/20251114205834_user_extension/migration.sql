-- AlterTable
ALTER TABLE "ProjectImage" ALTER COLUMN "imageUrl" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "agentDescription" TEXT,
ADD COLUMN     "isAgent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "profileDescription" TEXT;
