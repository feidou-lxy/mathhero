const DEFAULT_BASE_URL = "https://api.deepseek.com";
const DEFAULT_MODEL = "deepseek-chat";

export const MOCK_API_KEY = "sk-mock-placeholder";

export type AiChatMessage = {
  role: "system" | "user";
  content: string;
};

export type AiChatOptions = {
  /** 是否要求 JSON 对象响应，默认 true */
  jsonMode?: boolean;
  temperature?: number;
};

type DeepSeekChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

export function isMockApiKey(apiKey: string | undefined): boolean {
  return !apiKey || apiKey === MOCK_API_KEY || apiKey.startsWith("sk-mock");
}

/** 当前环境是否配置了可用的 DeepSeek API Key */
export function isAiAvailable(): boolean {
  return !isMockApiKey(process.env.DEEPSEEK_API_KEY);
}

/**
 * 项目唯一的 AI 调用入口（DeepSeek Chat Completions）。
 * 无有效 API Key 时抛出 MOCK_API_KEY，由上层走 Mock 降级。
 */
export async function callAiChat(
  messages: AiChatMessage[],
  options?: AiChatOptions,
): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY ?? MOCK_API_KEY;

  if (isMockApiKey(apiKey)) {
    throw new Error("MOCK_API_KEY");
  }

  const baseUrl = process.env.DEEPSEEK_BASE_URL ?? DEFAULT_BASE_URL;
  const model = process.env.DEEPSEEK_MODEL ?? DEFAULT_MODEL;
  const jsonMode = options?.jsonMode ?? true;

  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
      temperature: options?.temperature ?? 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek API error (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as DeepSeekChatResponse;
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("DeepSeek API returned empty content");
  }

  return content;
}
