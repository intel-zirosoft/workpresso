import {
  createDataStreamResponse,
  formatDataStreamPart,
  tool,
  type Message,
} from "ai";
import { z } from "zod";

import {
  createScheduleToolSchema,
  createScheduleViaPodBApi,
} from "@/features/pod-b/services/pod-b-schedule-api-adapter";
import { getResolvedAiConfig } from "@/lib/ai/config";
import { createEmbedding } from "@/lib/ai/embeddings";
import { createOpenRouterClient } from "@/lib/ai/openrouter";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const chatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.string(),
        content: z.unknown(),
      }),
    )
    .min(1, "최소 1개 이상의 메시지가 필요합니다."),
});

type CreateScheduleArgs = z.infer<typeof createScheduleToolSchema>;
type NormalizedChatMessage = Omit<Message, "id">;

const createScheduleToolDescription =
  "Pod-B 일정 생성 API 호출. start_time/end_time이 확정된 ISO 8601일 때만 호출하세요. 불충분하면 먼저 재질문하세요.";

const createScheduleToolParameters = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: {
      type: "string",
      description: "일정 제목",
    },
    start_time: {
      type: "string",
      format: "date-time",
      description: "ISO 8601 시작 시각",
    },
    end_time: {
      type: "string",
      format: "date-time",
      description: "ISO 8601 종료 시각",
    },
    type: {
      type: "string",
      enum: ["TASK", "MEETING", "VACATION", "WFH", "OUTSIDE", "HALF_DAY"],
      description: "일정 유형",
    },
    description: {
      type: "string",
      description: "일정 설명",
    },
    attendee_ids: {
      type: "array",
      items: {
        type: "string",
        format: "uuid",
      },
      description: "참석자 사용자 ID 목록",
    },
  },
  required: ["title", "start_time", "end_time"],
} as const;
function extractMessageText(content: unknown): string {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .flatMap((part) => {
        if (
          typeof part === "object" &&
          part !== null &&
          "type" in part &&
          "text" in part &&
          part.type === "text" &&
          typeof part.text === "string"
        ) {
          return [part.text];
        }

        return [];
      })
      .join("\n")
      .trim();
  }

  return "";
}

function extractAssistantResponseText(content: unknown) {
  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .flatMap((part) => {
        if (
          typeof part === "object" &&
          part !== null &&
          "type" in part &&
          "text" in part &&
          part.type === "text" &&
          typeof part.text === "string"
        ) {
          return [part.text];
        }

        return [];
      })
      .join("\n")
      .trim();
  }

  return "";
}

function toOpenRouterMessages(input: {
  system: string;
  messages: NormalizedChatMessage[];
}): any[] {
  return [
    {
      role: "system" as const,
      content: input.system,
    },
    ...input.messages
      .filter(
        (message) => message.role === "user" || message.role === "assistant",
      )
      .map((message) => ({
        role: message.role,
        content: typeof message.content === "string" ? message.content : "",
      })),
  ];
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser)
      return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { messages } = chatRequestSchema.parse(await req.json());
    const normalizedMessages: NormalizedChatMessage[] = messages.map(
      (message) => ({
        role: message.role as Message["role"],
        content: extractMessageText(message.content),
      }),
    );
    const lastMessage =
      normalizedMessages[normalizedMessages.length - 1]?.content ?? "";

    const adminSupabase = createAdminClient();

    let contextText = "관련 지식 없음";
    try {
      if (lastMessage.trim()) {
        const { embedding } = await createEmbedding(lastMessage);
        const { data: documents } = await adminSupabase.rpc("match_knowledge", {
          query_embedding: embedding,
          match_threshold: 0.1,
          match_count: 5,
        });
        if (documents) {
          contextText = documents
            .map((doc: any) => doc.metadata?.content || "")
            .filter(Boolean)
            .join("\n\n");
        }
      }
    } catch (e) {
      console.warn("RAG Skip", e);
    }

    const aiConfig = await getResolvedAiConfig();
    const client = await createOpenRouterClient();
    const now = new Date();
    const currentTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const systemPrompt = `당신은 워크프레소의 업무 비서입니다. 한국어로 친절하게 답변하세요.
현재 시각: ${now.toISOString()}
기준 시간대: ${currentTimeZone}
내부 지식: ${contextText}

규칙:
- 일정 생성은 반드시 Pod-B API(/api/schedules) 기반 tool 호출로만 처리하세요.
- 일정 생성 전에 title, start_time, end_time을 확정할 근거가 부족하면 tool을 호출하지 말고 먼저 짧게 재질문하세요.
- 상대시간 표현(예: 오늘, 내일, 다음 주)은 현재 시각과 시간대를 기준으로 해석하세요.
- 참석자 식별이 모호하면 attendee_ids를 추정하지 말고 후보를 제시하거나 다시 물어보세요.
- 일정 생성 후에는 생성 결과와 링크를 함께 안내하세요.`;

    const conversationMessages: any[] = toOpenRouterMessages({
      system: systemPrompt,
      messages: normalizedMessages,
    });

    const toolDefinition = tool({
      description: createScheduleToolDescription,
      parameters: createScheduleToolSchema,
      execute: async (payload: CreateScheduleArgs) => {
        const createdSchedule = await createScheduleViaPodBApi({
          payload,
          request: req,
        });

        return {
          message: `일정 '${createdSchedule.title}' 등록 완료`,
          schedule: createdSchedule,
        };
      },
    });

    const initialResponse = await client.chat.completions.create({
      model: aiConfig.chatModel,
      messages: conversationMessages,
      tools: [
        {
          type: "function",
          function: {
            name: "create_schedule",
            description: createScheduleToolDescription,
            parameters: createScheduleToolParameters,
          },
        },
      ],
      tool_choice: "auto",
    });

    const initialMessage = initialResponse.choices[0]?.message;
    let finalText = extractAssistantResponseText(initialMessage?.content);

    if (initialMessage?.tool_calls?.length) {
      conversationMessages.push({
        role: "assistant",
        content: initialMessage.content ?? "",
        tool_calls: initialMessage.tool_calls.map((toolCall) => ({
          id: toolCall.id,
          type: toolCall.type,
          function: {
            name: toolCall.function.name,
            arguments: toolCall.function.arguments,
          },
        })),
      });

      for (const toolCall of initialMessage.tool_calls) {
        if (
          toolCall.type !== "function" ||
          toolCall.function.name !== "create_schedule"
        ) {
          continue;
        }

        const payload = createScheduleToolSchema.parse(
          JSON.parse(toolCall.function.arguments || "{}"),
        );
        const toolResult = await toolDefinition.execute(payload, {
          toolCallId: toolCall.id,
          messages: [],
        });

        conversationMessages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(toolResult),
        });
      }

      const finalResponse = await client.chat.completions.create({
        model: aiConfig.chatModel,
        messages: conversationMessages,
      });

      finalText =
        extractAssistantResponseText(finalResponse.choices[0]?.message?.content) ||
        finalText;
    }

    return createDataStreamResponse({
      execute: (dataStream) => {
        if (finalText) {
          dataStream.write(formatDataStreamPart("text", finalText));
        }

        dataStream.write(
          formatDataStreamPart("finish_message", {
            finishReason: "stop",
            usage: initialResponse.usage
              ? {
                  promptTokens: initialResponse.usage.prompt_tokens,
                  completionTokens: initialResponse.usage.completion_tokens,
                }
              : undefined,
          }),
        );
      },
      onError: (error) => {
        const message =
          error instanceof Error
            ? error.message
            : typeof error === "string"
              ? error
              : "An error occurred.";

        console.error("Chat stream error:", error);

        return message;
      },
    });
  } catch (error: any) {
    console.error("Fatal Error:", error.message);
    return new Response(error.message, { status: 500 });
  }
}
