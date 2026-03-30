import {
  convertToCoreMessages,
  streamText,
  tool,
  type Message,
} from "ai";
import { z } from "zod";

import {
  buildScheduleKnowledgeContent,
  upsertKnowledgeSource,
} from "@/features/pod-c/services/knowledge-sync";
import { getChatLanguageModel } from "@/lib/ai/chat";
import { createEmbedding } from "@/lib/ai/embeddings";
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

const createScheduleSchema = z.object({
  title: z.string().describe("일정 제목"),
  start_time: z.string().describe("시작 시간"),
  end_time: z.string().describe("종료 시간"),
});

type CreateScheduleArgs = z.infer<typeof createScheduleSchema>;
type NormalizedChatMessage = Omit<Message, "id">;

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

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser)
      return Response.json({ error: "Unauthorized" }, { status: 401 });

    const userId = authUser.id;
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

    const chatModel = await getChatLanguageModel();
    const result = await streamText({
      model: chatModel,
      system: `당신은 워크프레소의 업무 비서입니다. 한국어로 친절하게 답변하세요. 내부 지식: ${contextText}`,
      messages: convertToCoreMessages(normalizedMessages),
      maxSteps: 2,
      tools: {
        create_schedule: tool({
          description: "일정 등록",
          parameters: createScheduleSchema,
          execute: async ({
            title,
            start_time,
            end_time,
          }: CreateScheduleArgs) => {
            const { data, error } = await adminSupabase
              .from("schedules")
              .insert([{ title, start_time, end_time, user_id: userId }])
              .select()
              .single();
            if (error) throw new Error(error.message);

            try {
              await upsertKnowledgeSource({
                sourceType: "SCHEDULES",
                sourceId: data.id,
                title: data.title,
                content: buildScheduleKnowledgeContent({
                  title: data.title,
                  startTime: data.start_time,
                  endTime: data.end_time,
                  type: data.type,
                }),
                metadata: {
                  user_id: userId,
                  start_time: data.start_time,
                  end_time: data.end_time,
                  type: data.type ?? null,
                },
              });
            } catch (syncError) {
              console.error("schedule knowledge sync failed:", syncError);
              return `일정 '${title}' 등록 완료. 다만 RAG 동기화는 재시도가 필요합니다.`;
            }

            return `일정 '${title}' 등록 완료.`;
          },
        }),
      },
    });

    return result.toDataStreamResponse();
  } catch (error: any) {
    console.error("Fatal Error:", error.message);
    return new Response(error.message, { status: 500 });
  }
}
