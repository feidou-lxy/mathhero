import type { QuestionCategory } from "@/types/math";

type LogicQuestionInput = {
  category: QuestionCategory;
  prompt: string;
  options?: string[];
  answer: number;
};

type ComparisonEdge = {
  higher: string;
  lower: string;
};

function addEdge(
  edges: ComparisonEdge[],
  higher: string,
  lower: string,
  names: string[],
): void {
  if (!names.includes(higher) || !names.includes(lower) || higher === lower) {
    return;
  }

  if (edges.some((edge) => edge.higher === higher && edge.lower === lower)) {
    return;
  }

  edges.push({ higher, lower });
}

function extractSpeechSegment(prompt: string, speaker: string): string {
  const start = prompt.indexOf(`${speaker}说`);
  if (start === -1) return "";

  const afterSpeech = prompt.slice(start);
  const end = afterSpeech.search(/[。！？?]/);
  return end === -1 ? afterSpeech : afterSpeech.slice(0, end + 1);
}

function extractComparisons(prompt: string, names: string[]): ComparisonEdge[] {
  const edges: ComparisonEdge[] = [];

  for (const higher of names) {
    for (const lower of names) {
      if (higher === lower) continue;
      if (prompt.includes(`${higher}比${lower}高`)) {
        addEdge(edges, higher, lower, names);
      }
      if (prompt.includes(`${higher}比${lower}矮`)) {
        addEdge(edges, lower, higher, names);
      }
    }
  }

  for (const speaker of names) {
    const segment = extractSpeechSegment(prompt, speaker);
    if (!segment) continue;

    for (const other of names) {
      if (other === speaker) continue;
      if (segment.includes(`我比${other}高`)) {
        addEdge(edges, speaker, other, names);
      }
      if (segment.includes(`我比${other}矮`)) {
        addEdge(edges, other, speaker, names);
      }
    }
  }

  return edges;
}

function buildBeatMatrix(
  options: string[],
  edges: ComparisonEdge[],
): boolean[][] {
  const size = options.length;
  const indexByName = new Map(options.map((name, index) => [name, index]));
  const beats = Array.from({ length: size }, () => Array<boolean>(size).fill(false));

  for (const { higher, lower } of edges) {
    const higherIndex = indexByName.get(higher);
    const lowerIndex = indexByName.get(lower);
    if (higherIndex === undefined || lowerIndex === undefined) continue;
    beats[higherIndex][lowerIndex] = true;
  }

  for (let pivot = 0; pivot < size; pivot += 1) {
    for (let left = 0; left < size; left += 1) {
      for (let right = 0; right < size; right += 1) {
        beats[left][right] = beats[left][right] || (beats[left][pivot] && beats[pivot][right]);
      }
    }
  }

  return beats;
}

function findUniqueExtreme(
  options: string[],
  edges: ComparisonEdge[],
  kind: "max" | "min",
): number | null {
  const beats = buildBeatMatrix(options, edges);
  let uniqueIndex: number | null = null;

  for (let candidate = 0; candidate < options.length; candidate += 1) {
    const beatsAllOthers = options.every((_, other) => {
      if (candidate === other) return true;
      return kind === "max"
        ? beats[candidate][other]
        : beats[other][candidate];
    });

    if (!beatsAllOthers) continue;
    if (uniqueIndex !== null) return null;
    uniqueIndex = candidate;
  }

  return uniqueIndex;
}

function asksForMaximum(prompt: string): boolean {
  return /谁最高|最高的是谁|谁更高/.test(prompt);
}

function asksForMinimum(prompt: string): boolean {
  return /谁最矮|最矮的是谁|谁更矮/.test(prompt);
}

export function validateLogicReasoningQuestion(
  question: LogicQuestionInput,
): string | null {
  if (question.category !== "logic_reasoning") return null;

  if (!question.options || question.options.length < 2) {
    return "logic_reasoning question must include at least 2 options";
  }

  if (
    /三个人|三人/.test(question.prompt) &&
    question.options.length < 3
  ) {
    return "logic_reasoning question mentions three people but options are incomplete";
  }

  if (
    question.answer < 0 ||
    question.answer >= question.options.length ||
    !Number.isInteger(question.answer)
  ) {
    return "logic_reasoning answer must be a valid options index";
  }

  const asksMax = asksForMaximum(question.prompt);
  const asksMin = asksForMinimum(question.prompt);
  if (!asksMax && !asksMin) {
    return null;
  }

  const edges = extractComparisons(question.prompt, question.options);
  if (edges.length === 0) {
    return "logic_reasoning height/order question must include explicit comparisons";
  }

  if (asksMax) {
    const uniqueTop = findUniqueExtreme(question.options, edges, "max");
    if (uniqueTop === null) {
      return "logic_reasoning question is ambiguous: tallest person is not uniquely determined";
    }
    if (uniqueTop !== question.answer) {
      return "logic_reasoning answer does not match the uniquely determined tallest person";
    }
  }

  if (asksMin) {
    const uniqueBottom = findUniqueExtreme(question.options, edges, "min");
    if (uniqueBottom === null) {
      return "logic_reasoning question is ambiguous: shortest person is not uniquely determined";
    }
    if (uniqueBottom !== question.answer) {
      return "logic_reasoning answer does not match the uniquely determined shortest person";
    }
  }

  return null;
}
