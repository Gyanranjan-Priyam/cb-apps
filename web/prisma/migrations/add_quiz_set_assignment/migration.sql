-- CreateTable
CREATE TABLE "quiz_set_assignment" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assignedSet" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quiz_set_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "quiz_set_assignment_quizId_userId_key" ON "quiz_set_assignment"("quizId", "userId");

-- AddForeignKey
ALTER TABLE "quiz_set_assignment" ADD CONSTRAINT "quiz_set_assignment_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;
