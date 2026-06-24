import { TEACHER_NAME } from "@/lib/ai/teacherCharacter";
import { callAiChat, isMockApiKey } from "@/lib/ai";
import {
  buildTutorSystemPrompt,
  buildTutorUserPrompt,
} from "@/lib/ai/tutorPrompts";
import { isExtensionQuestion } from "@/lib/ai/tutorTeachingStyle";
import {
  MAX_HINT_ROUNDS,
  type TutorFeedbackRequest,
  type TutorFeedbackResponse,
} from "@/lib/types/tutor";

type ParsedTutorContent = {
  message: string;
  explanation?: string;
  inviteDialogue?: boolean;
};

function parseTutorContent(content: string): ParsedTutorContent | null {
  try {
    const parsed = JSON.parse(content) as {
      message?: unknown;
      explanation?: unknown;
      inviteDialogue?: unknown;
    };
    const message =
      typeof parsed.message === "string" && parsed.message.trim()
        ? parsed.message.trim()
        : null;
    if (!message) return null;

    const explanation =
      typeof parsed.explanation === "string" && parsed.explanation.trim()
        ? parsed.explanation.trim()
        : undefined;

    const inviteDialogue =
      typeof parsed.inviteDialogue === "boolean"
        ? parsed.inviteDialogue
        : undefined;

    return { message, explanation, inviteDialogue };
  } catch {
    const trimmed = content.trim();
    return trimmed ? { message: trimmed } : null;
  }
}

function buildMockExplanation(req: TutorFeedbackRequest): string {
  const { question } = req;
  const unit = question.unit ?? "个";

  switch (question.category) {
    case "addition":
      return `真棒！你可以想成：左手有一些${unit}苹果，右手再拿来一些，合起来数一数就是一共有多少。两个数慢慢加过去就对啦！`;
    case "subtraction":
      return `很好！就像有一堆糖果，拿走一些后看看还剩多少。从大的数开始，想想拿走了几个，剩下的就是答案啦！`;
    case "multiplication":
      return `不错！可以想成「几组一样多的东西」：比如每组有同样多的贴纸，有好几组，每组数量一样，加起来就是乘法啦！`;
    case "division":
      return `太厉害了！就像把 12 个苹果平均分给 3 个小朋友：第一步，数一数一共几个苹果；第二步，分给 3 人，每人分到一样多；第三步，每人就能分到几个啦！`;
    case "two_step_word":
    case "multi_step_word":
      return `做得好！第一步，先读故事，找出题目里的数字；第二步，想想先算什么（合起来还是拿走）；第三步，用算出的结果继续算下一步。你就是这样一步一步想对的！`;
    case "time_money":
      return `很棒！第一步，看看是求时间还是求钱；第二步，找出用了多少、还剩多少；第三步，慢慢算，元角要分清哦！`;
    case "pattern_sequence":
      return `你观察得很仔细！先看看相邻两个数差多少，或者是不是每次加同样的数——找到规律后，下一项就能想出来啦！`;
    case "logic_reasoning":
      return `你想得很认真！先把题目里能确定的信息找出来，再想想谁比谁大、谁比谁小，一步一步推，就能找到答案啦！`;
    case "shape_pattern":
      return `眼睛真亮！看看图形是怎么一组一组重复的，找到这一组的规律，再数到你要的那一项就好啦！`;
    case "clever_calc":
      return `巧算用得真好！看看哪两个数能先凑成整十，把它们加在一起，算起来就轻松多啦！`;
    default:
      return `真棒！先把题目里的数字找出来，想想是要合起来、拿走，还是平均分，一步一步算，你就对啦！`;
  }
}

function buildExtensionMockHint(attemptNumber: number): string {
  const hints = [
    "没关系，再观察一下～ 题目里有没有重复的规律？先找前几个数的关系试试？",
    "你已经很接近啦！想想图形或数字是一组一组怎么排的？",
    "加油！换个角度看看，先找最简单的那条规律，再往下推～你觉得下一步该想什么？",
    `${TEACHER_NAME}相信你能行！再读一遍题目，把你能发现的小线索告诉小M老师，我们一起想～`,
  ];
  return hints[Math.min(attemptNumber - 1, hints.length - 1)];
}

function buildMockFeedback(
  req: TutorFeedbackRequest,
  isCorrect: boolean,
): TutorFeedbackResponse {
  const { question, attemptNumber } = req;
  const unit = question.unit ? ` ${question.unit}` : "";
  const isExtension = isExtensionQuestion(question);

  if (isCorrect) {
    if (isExtension) {
      return {
        isCorrect: true,
        message: "太棒了，想对了！🎉",
        explanation:
          `${TEACHER_NAME}觉得你找规律/推理的方法很对！以后遇到这种题，也可以像今天一样，先观察、再一步一步想。`,
      };
    }
    return {
      isCorrect: true,
      message: `太棒了，答对啦！🎉 ${TEACHER_NAME}为你点赞！`,
      explanation: buildMockExplanation(req),
    };
  }

  if (isExtension) {
    return {
      isCorrect: false,
      hintRound: attemptNumber,
      message: buildExtensionMockHint(attemptNumber),
      inviteDialogue: true,
    };
  }

  if (attemptNumber > MAX_HINT_ROUNDS) {
    if (question.category === "division") {
      return {
        isCorrect: false,
        answerRevealed: true,
        message: `你已经很努力了！${TEACHER_NAME}来帮你～答案是 ${question.answer}${unit}。就像把东西平均分给几个小朋友：一共几个，分给几人，每人几个——按这个方法算，就是 ${question.answer}${unit}。下次你一定可以的！💪`,
      };
    }
    if (
      question.category === "two_step_word" ||
      question.category === "time_money" ||
      question.category === "multi_step_word"
    ) {
      return {
        isCorrect: false,
        answerRevealed: true,
        message: `你已经很努力了！${TEACHER_NAME}来帮你～答案是 ${question.answer}${unit}。第一步先找题目里的数，第二步想先算什么，第三步再算下一步——慢慢按步骤来，下次一定能做对！💪`,
      };
    }
    return {
      isCorrect: false,
      answerRevealed: true,
      message: `你已经很努力了，${TEACHER_NAME}来帮你！答案是 ${question.answer}${unit}。把题目里的数想清楚，一步一步算，下次你一定可以的！💪`,
    };
  }

  const hints = [
    `没关系，${TEACHER_NAME}陪你再想想～ 你可以先把题目里的数字圈出来，想想这是在求「变多」还是「变少」呢？`,
    "你已经很接近啦！试着想想，是要把东西合起来，还是从一堆里拿走一些呢？",
    `加油！再读一遍题目，像讲故事一样把数字找出来，一步一步想，${TEACHER_NAME}相信你能算出来！`,
  ];

  return {
    isCorrect: false,
    hintRound: attemptNumber,
    message: hints[Math.min(attemptNumber - 1, hints.length - 1)],
    inviteDialogue: true,
  };
}

export async function getTutorFeedback(
  req: TutorFeedbackRequest,
): Promise<TutorFeedbackResponse> {
  const userNum = Number(req.userAnswer);
  const isCorrect = userNum === req.question.answer;
  const isExtension = isExtensionQuestion(req.question);

  if (isMockApiKey(process.env.DEEPSEEK_API_KEY)) {
    return buildMockFeedback(req, isCorrect);
  }

  const messages = [
    {
      role: "system" as const,
      content: buildTutorSystemPrompt(req.question),
    },
    {
      role: "user" as const,
      content: buildTutorUserPrompt(req, isCorrect),
    },
  ];

  const content = await callAiChat(messages, {
    jsonMode: true,
    temperature: 0.6,
  });
  const parsed = parseTutorContent(content);

  if (!parsed) {
    return buildMockFeedback(req, isCorrect);
  }

  if (isCorrect) {
    return {
      isCorrect: true,
      message: parsed.message,
      explanation: isExtension
        ? parsed.explanation
        : parsed.explanation ?? buildMockExplanation(req),
    };
  }

  if (req.attemptNumber > MAX_HINT_ROUNDS && !isExtension) {
    return {
      isCorrect: false,
      answerRevealed: true,
      message: parsed.message,
    };
  }

  return {
    isCorrect: false,
    hintRound: req.attemptNumber,
    message: parsed.message,
    inviteDialogue: parsed.inviteDialogue ?? true,
  };
}
