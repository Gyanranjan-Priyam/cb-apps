/* eslint-disable @typescript-eslint/no-explicit-any */
// Generate unique quiz ID
export function generateQuizId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  return `CODEBREAKER-QUIZZES-${timestamp}${random}`;
}

/**
 * Universal helper to extract questions for a specific Shift and Question Set from questionsJson.
 * Fully supports:
 * 1. Shift-wise structured JSON: { "shift_1": { "A": [...], "B": [...] }, "shift_2": { "A": [...] } }
 * 2. Flat shift keys: { "shift_1_A": [...], "1_A": [...] }
 * 3. Legacy set keys: { "A": [...], "B": [...] }
 * 4. Raw array format: [ ... ]
 */
export function getQuestionsForShiftAndSet(
  questionsDataOrJson: any,
  shiftNumber: number = 1,
  setLetter: string = "A"
): any[] {
  if (!questionsDataOrJson) return [];

  let data = questionsDataOrJson;
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      return [];
    }
  }

  if (Array.isArray(data)) {
    return data;
  }

  if (typeof data !== "object" || data === null) {
    return [];
  }

  const cleanSet = (setLetter || "A").trim().toUpperCase();
  const shiftKey = `shift_${shiftNumber}`;

  // 1. Check nested shift object: data.shift_1["A"]
  const matchingShiftKey = Object.keys(data).find(
    (k) => k.toLowerCase() === shiftKey.toLowerCase() || k === String(shiftNumber)
  );
  if (matchingShiftKey && typeof data[matchingShiftKey] === "object" && !Array.isArray(data[matchingShiftKey])) {
    const shiftObj = data[matchingShiftKey];
    const matchingSetKey = Object.keys(shiftObj).find(
      (k) => k.toUpperCase() === cleanSet
    );
    if (matchingSetKey && Array.isArray(shiftObj[matchingSetKey])) {
      return shiftObj[matchingSetKey];
    }
    // Fallback to first available set in that shift
    const firstSet = Object.keys(shiftObj)[0];
    if (firstSet && Array.isArray(shiftObj[firstSet])) {
      return shiftObj[firstSet];
    }
  }

  // 2. Check flat composite keys: "shift_1_A" or "1_A"
  for (const k of Object.keys(data)) {
    const match = k.match(/^(?:shift_)?(\d+)_([A-Za-z])$/i);
    if (match) {
      const sNum = parseInt(match[1], 10);
      const letter = match[2].toUpperCase();
      if (sNum === shiftNumber && letter === cleanSet && Array.isArray(data[k])) {
        return data[k];
      }
    }
  }

  // 3. Fallback to top-level set key: data["A"]
  const matchingTopSet = Object.keys(data).find((k) => k.toUpperCase() === cleanSet);
  if (matchingTopSet && Array.isArray(data[matchingTopSet])) {
    return data[matchingTopSet];
  }

  // 4. Fallback to default "A" or first array found
  if (Array.isArray(data["A"])) {
    return data["A"];
  }

  for (const key of Object.keys(data)) {
    if (Array.isArray(data[key])) {
      return data[key];
    }
  }

  return [];
}

/**
 * Parse questionsJson into a nested shift map: { [shiftNumber]: { [setLetter]: Question[] } }
 */
export function parseQuestionsByShiftAndSet(
  questionsJson: string | any,
  totalShifts: number = 1,
  totalSets: number = 1
): Record<number, Record<string, any[]>> {
  const result: Record<number, Record<string, any[]>> = {};

  const maxShifts = Math.max(totalShifts || 1, 1);
  const maxSets = Math.max(totalSets || 1, 1);

  // Initialize empty shifts
  for (let s = 1; s <= maxShifts; s++) {
    result[s] = {};
    for (let setIdx = 0; setIdx < maxSets; setIdx++) {
      const letter = String.fromCharCode(65 + setIdx);
      result[s][letter] = [];
    }
  }

  if (!questionsJson) {
    return result;
  }

  try {
    let parsed = questionsJson;
    if (typeof questionsJson === "string") {
      if (!questionsJson.trim()) return result;
      parsed = JSON.parse(questionsJson);
    }

    if (Array.isArray(parsed)) {
      if (!result[1]) result[1] = {};
      result[1]["A"] = parsed;
      return result;
    }

    if (typeof parsed === "object" && parsed !== null) {
      let hasNestedShifts = false;

      // 1. Nested shift_X structure: { "shift_1": { "A": [...], "B": [...] } }
      Object.keys(parsed).forEach((key) => {
        const match = key.match(/^(?:shift_)?(\d+)$/i);
        if (match && typeof parsed[key] === "object" && parsed[key] !== null && !Array.isArray(parsed[key])) {
          hasNestedShifts = true;
          const sNum = parseInt(match[1], 10);
          if (!result[sNum]) result[sNum] = {};
          const shiftObj = parsed[key];
          Object.entries(shiftObj).forEach(([letter, list]) => {
            if (Array.isArray(list)) {
              result[sNum][letter.toUpperCase()] = list;
            }
          });
        }
      });

      // 2. Flat composite keys: { "shift_1_A": [...], "1_A": [...] }
      Object.keys(parsed).forEach((key) => {
        const match = key.match(/^(?:shift_)?(\d+)_([A-Za-z])$/i);
        if (match && Array.isArray(parsed[key])) {
          const sNum = parseInt(match[1], 10);
          const letter = match[2].toUpperCase();
          if (!result[sNum]) result[sNum] = {};
          result[sNum][letter] = parsed[key];
        }
      });

      // 3. Top-level set keys: { "A": [...], "B": [...] }
      if (!hasNestedShifts) {
        Object.entries(parsed).forEach(([key, list]) => {
          if (Array.isArray(list) && key.length === 1 && key.toUpperCase() >= "A" && key.toUpperCase() <= "Z") {
            if (!result[1]) result[1] = {};
            result[1][key.toUpperCase()] = list;
          }
        });
      }
    }
  } catch (e) {
    console.error("Error parsing questions by shift and set:", e);
  }

  return result;
}
