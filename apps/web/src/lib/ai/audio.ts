import "server-only";

import {
  getOpenRouterRuntimeConfig,
  getResolvedAiConfig,
} from "@/lib/ai/config";
import { normalizeModelId } from "@/lib/ai/models";

const DEFAULT_STT_PROMPT =
  '이 오디오의 내용을 한글로 정확하게 받아쓰기(STT) 해. 아무런 부연 설명이나 요약 없이, 오로지 들리는 음성 그대로 텍스트만 출력해. 만약 음성이 전혀 들리지 않거나 잡음만 있다면 "음성이 인식되지 않았습니다."라고만 출력해.';

const DEFAULT_STT_SYSTEM_PROMPT =
  "You are a speech-to-text engine. Return only the transcription text with no explanation, markdown, or metadata.";

function inferAudioFormat(mimeType?: string, fileName?: string) {
  const normalizedMime = mimeType?.split(";")[0]?.toLowerCase();

  if (normalizedMime?.includes("wav")) return "wav";
  if (normalizedMime?.includes("mpeg")) return "mp3";
  if (normalizedMime?.includes("mp4")) return "m4a";
  if (normalizedMime?.includes("aac")) return "aac";
  if (normalizedMime?.includes("ogg")) return "ogg";
  if (normalizedMime?.includes("flac")) return "flac";
  if (normalizedMime?.includes("aiff")) return "aiff";
  if (normalizedMime?.includes("webm")) return "webm";

  const extension = fileName?.split(".").pop()?.toLowerCase();

  if (
    extension &&
    ["wav", "mp3", "m4a", "aac", "ogg", "flac", "aiff", "webm"].includes(
      extension,
    )
  ) {
    return extension;
  }

  return "wav";
}

function detectAudioFormatFromBuffer(audioBuffer: Buffer) {
  if (audioBuffer.length < 12) {
    return undefined;
  }

  const ascii4 = (offset: number) =>
    audioBuffer.subarray(offset, offset + 4).toString("ascii");

  if (ascii4(0) === "RIFF" && ascii4(8) === "WAVE") return "wav";
  if (ascii4(0) === "OggS") return "ogg";
  if (ascii4(0) === "fLaC") return "flac";
  if (ascii4(0) === "FORM" && ascii4(8) === "AIFF") return "aiff";
  if (ascii4(4) === "ftyp") return "m4a";
  if (ascii4(0) === "ID3") return "mp3";

  const firstFourBytes = audioBuffer.subarray(0, 4);
  if (
    firstFourBytes[0] === 0x1a &&
    firstFourBytes[1] === 0x45 &&
    firstFourBytes[2] === 0xdf &&
    firstFourBytes[3] === 0xa3
  ) {
    return "webm";
  }

  if (audioBuffer[0] === 0xff && (audioBuffer[1] & 0xe0) === 0xe0) {
    return "mp3";
  }

  return undefined;
}

function extractTextContent(content: unknown) {
  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .flatMap((item) => {
        if (
          typeof item === "object" &&
          item !== null &&
          "text" in item &&
          typeof item.text === "string"
        ) {
          return [item.text];
        }

        return [];
      })
      .join("\n")
      .trim();
  }

  return "";
}

export async function transcribeAudioWithOpenRouter(input: {
  audioBuffer: Buffer;
  mimeType?: string;
  fileName?: string;
  prompt?: string;
  model?: string;
}) {
  const runtimeConfig = await getOpenRouterRuntimeConfig();
  const aiConfig = await getResolvedAiConfig();
  const model = normalizeModelId(input.model ?? aiConfig.sttModel, "stt");
  const detectedFormat = detectAudioFormatFromBuffer(input.audioBuffer);
  const format =
    detectedFormat ?? inferAudioFormat(input.mimeType, input.fileName);

  const response = await fetch(`${runtimeConfig.baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${runtimeConfig.apiKey}`,
      "Content-Type": "application/json",
      ...runtimeConfig.headers,
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      stream: false,
      messages: [
        {
          role: "system",
          content: DEFAULT_STT_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: input.prompt ?? DEFAULT_STT_PROMPT,
            },
            {
              type: "input_audio",
              input_audio: {
                data: input.audioBuffer.toString("base64"),
                format,
              },
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `OpenRouter STT 호출 실패: ${response.status} ${errorBody || response.statusText}`,
    );
  }

  const result = await response.json();
  const transcription = extractTextContent(
    result.choices?.[0]?.message?.content,
  );

  if (!transcription) {
    throw new Error("STT 응답 텍스트가 비어 있습니다.");
  }

  return { text: transcription, model, format };
}
