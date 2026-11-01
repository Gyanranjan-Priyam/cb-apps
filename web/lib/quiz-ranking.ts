/**
 * CBT Quiz Submission Time Tracking and Ranking Engine
 *
 * Ranking Criteria:
 * 1. Primary: Marks / Score (Higher marks = Higher rank)
 * 2. Secondary: Submission time (Earlier completedAt / submission time = Higher rank when marks are equal)
 * 3. Identical tie-break: If both marks and submission time are identical, both candidates receive the exact same rank.
 */

export interface RankableAttempt {
  id: string;
  score: number;
  pointsEarned?: number | null;
  correctAnswers?: number | null;
  completedAt?: Date | string | null;
  createdAt?: Date | string | null;
  answersJson?: string | null;
}

export interface RankedResultItem {
  id: string;
  rank: number;
  isTied: boolean;
  marks: number;
  score: number;
  submissionTimestamp: number;
  submissionDate: Date;
}

/**
 * Extracts exact submission timestamp in milliseconds from completedAt, answersJson, or createdAt fallback.
 */
export function getAttemptSubmissionTimestamp(attempt: RankableAttempt): number {
  if (attempt.completedAt) {
    const time = new Date(attempt.completedAt).getTime();
    if (!isNaN(time) && time > 0) return time;
  }

  if (attempt.answersJson) {
    try {
      const parsed = JSON.parse(attempt.answersJson);
      if (parsed.submittedAt) {
        const time = new Date(parsed.submittedAt).getTime();
        if (!isNaN(time) && time > 0) return time;
      }
    } catch {
      // Ignore JSON parse error fallback
    }
  }

  if (attempt.createdAt) {
    const time = new Date(attempt.createdAt).getTime();
    if (!isNaN(time) && time > 0) return time;
  }

  return 0;
}

/**
 * Comparator function for sorting CBT Quiz Attempts.
 * Primary: Higher points/score first (descending).
 * Secondary: Earlier submission time first (ascending).
 */
export function compareQuizAttempts(a: RankableAttempt, b: RankableAttempt): number {
  const aMarks = a.pointsEarned ?? a.score ?? 0;
  const bMarks = b.pointsEarned ?? b.score ?? 0;

  // 1. Primary: Marks (Higher = Better)
  if (bMarks !== aMarks) {
    return bMarks - aMarks;
  }

  // Secondary sub-check: Score percentage if points were equal
  const aScore = a.score ?? 0;
  const bScore = b.score ?? 0;
  if (bScore !== aScore) {
    return bScore - aScore;
  }

  // Secondary sub-check: Correct answers count
  const aCorrect = a.correctAnswers ?? 0;
  const bCorrect = b.correctAnswers ?? 0;
  if (bCorrect !== aCorrect) {
    return bCorrect - aCorrect;
  }

  // 2. Secondary: Submission time (Earlier = Better)
  const aTime = getAttemptSubmissionTimestamp(a);
  const bTime = getAttemptSubmissionTimestamp(b);

  if (aTime !== bTime) {
    return aTime - bTime;
  }

  return 0;
}

/**
 * Calculates competition rankings for an array of quiz attempts with tie handling.
 * Returns a map from attempt ID to { rank, isTied, marks, submissionDate }.
 */
export function calculateQuizRankings<T extends RankableAttempt>(
  attempts: T[]
): {
  sortedAttempts: T[];
  rankMap: Map<string, number>;
  rankedDetailsMap: Map<string, RankedResultItem>;
} {
  if (!attempts || attempts.length === 0) {
    return {
      sortedAttempts: [],
      rankMap: new Map(),
      rankedDetailsMap: new Map(),
    };
  }

  // Sort attempts according to primary (marks desc) and secondary (submission time asc)
  const sorted = [...attempts].sort(compareQuizAttempts);

  const rankMap = new Map<string, number>();
  const rankedDetailsMap = new Map<string, RankedResultItem>();

  let currentRank = 1;

  for (let i = 0; i < sorted.length; i++) {
    const curr = sorted[i];
    const currMarks = curr.pointsEarned ?? curr.score ?? 0;
    const currScore = curr.score ?? 0;
    const currTime = getAttemptSubmissionTimestamp(curr);

    if (i > 0) {
      const prev = sorted[i - 1];
      const prevMarks = prev.pointsEarned ?? prev.score ?? 0;
      const prevScore = prev.score ?? 0;
      const prevTime = getAttemptSubmissionTimestamp(prev);

      // Check if current is identical to previous in both marks and submission time
      const isIdentical =
        currMarks === prevMarks &&
        currScore === prevScore &&
        currTime === prevTime;

      if (!isIdentical) {
        // Standard competition ranking (1, 2, 2, 4...)
        currentRank = i + 1;
      }
    } else {
      currentRank = 1;
    }

    rankMap.set(curr.id, currentRank);
    rankedDetailsMap.set(curr.id, {
      id: curr.id,
      rank: currentRank,
      isTied: false, // Will be marked in second pass below
      marks: currMarks,
      score: currScore,
      submissionTimestamp: currTime,
      submissionDate: new Date(currTime || Date.now()),
    });
  }

  // Second pass: Mark isTied = true for any shared ranks
  const rankCountMap = new Map<number, number>();
  rankMap.forEach((r) => {
    rankCountMap.set(r, (rankCountMap.get(r) || 0) + 1);
  });

  rankedDetailsMap.forEach((item) => {
    if ((rankCountMap.get(item.rank) || 0) > 1) {
      item.isTied = true;
    }
  });

  return {
    sortedAttempts: sorted,
    rankMap,
    rankedDetailsMap,
  };
}

/**
 * Helper to get rank of a single attempt among all attempts of a quiz.
 */
export function getSingleAttemptRank(
  allAttempts: RankableAttempt[],
  targetAttemptId: string
): { rank: number; isTied: boolean; totalParticipants: number } {
  const { rankMap, rankedDetailsMap } = calculateQuizRankings(allAttempts);
  const rank = rankMap.get(targetAttemptId) || 1;
  const details = rankedDetailsMap.get(targetAttemptId);

  return {
    rank,
    isTied: details?.isTied || false,
    totalParticipants: allAttempts.length,
  };
}
