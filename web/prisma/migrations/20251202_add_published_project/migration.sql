-- CreateTable
CREATE TABLE "published_project" (
    "id" TEXT NOT NULL,
    "githubRepoId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "techStack" TEXT[],
    "projectUrl" TEXT,
    "thumbnailKey" TEXT NOT NULL,
    "publishedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "published_project_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "published_project_githubRepoId_key" ON "published_project"("githubRepoId");

-- CreateIndex
CREATE INDEX "published_project_publishedById_idx" ON "published_project"("publishedById");

-- AddForeignKey
ALTER TABLE "published_project" ADD CONSTRAINT "published_project_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
