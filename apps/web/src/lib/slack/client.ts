/**
 * [Part 5 - Common Slack Client]
 * 
 * 데이터베이스(Supabase) 또는 환경 변수에서 Slack 설정을 로드하고
 * 메시지를 전송하는 공통 유틸리티입니다.
 */

import { createClient } from "@/lib/supabase/server";

interface SlackConfig {
  webhookUrl: string;
}

/**
 * 우선순위: 1. DB (workspace_extensions), 2. Env (.env.local)
 */
async function getActiveSlackConfig(): Promise<SlackConfig | null> {
  // 1. DB에서 활성화된 설정 조회
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('workspace_extensions')
      .select('config, is_active')
      .eq('ext_name', 'slack')
      .single();

    if (data && data.is_active && data.config) {
      const cfg = data.config as any;
      if (cfg.webhookUrl) {
        return { webhookUrl: cfg.webhookUrl };
      }
    }
  } catch (e) {
    console.error("[Slack Client] DB 설정 로드 실패 (로그인 필요 혹은 테이블 없음):", e);
  }

  // 2. 환경변수에서 조회 (Fallback)
  if (process.env.SLACK_WEBHOOK_URL) {
    return { webhookUrl: process.env.SLACK_WEBHOOK_URL };
  }

  return null;
}

/**
 * Slack 메시지 전송 공통 함수
 */
export async function sendSlackMessage(payload: { blocks: any[]; text?: string }) {
  const config = await getActiveSlackConfig();

  if (!config) {
    console.log("[Slack Client - DUMMY MODE] 설정이 없어 콘솔에 출력합니다.");
    return { ok: true, mode: "dummy", message: "설정이 누락되었습니다." };
  }

  const res = await fetch(config.webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Slack 전송 실패: ${res.status} ${await res.text()}`);
  }

  return { ok: true, mode: "live" };
}
