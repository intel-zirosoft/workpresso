"use client";

import {
  Check,
  Layers3,
  Monitor,
  Moon,
  Sparkles,
  SunMedium,
} from "lucide-react";

import {
  THEME_LABELS,
  THEME_OPTIONS,
  THEME_VISUAL_PRESET_LABELS,
  THEME_VISUAL_PRESET_OPTIONS,
  type ThemePreference,
  type ThemeVisualPreset,
} from "@/lib/theme";
import { LiquidGlassFrame } from "@/components/theme/liquid-glass-frame";
import { useTheme } from "@/providers/theme-provider";
import { cn } from "@/lib/utils";

const themeModeMeta: Record<
  ThemePreference,
  { icon: typeof Monitor; description: string }
> = {
  default: {
    icon: Monitor,
    description: "운영체제 설정을 따라 라이트/다크를 자동으로 전환합니다.",
  },
  light: {
    icon: SunMedium,
    description:
      "현재 Classic 디자인을 유지하면서 밝은 작업 환경을 사용합니다.",
  },
  dark: {
    icon: Moon,
    description: "눈부심을 줄인 어두운 작업 환경을 고정으로 사용합니다.",
  },
};

const presetMeta: Record<
  ThemeVisualPreset,
  {
    icon: typeof Layers3;
    description: string;
    previewClassName: string;
  }
> = {
  classic: {
    icon: Layers3,
    description: "현재 Workpresso의 따뜻하고 부드러운 기본 테마를 유지합니다.",
    previewClassName:
      "bg-[linear-gradient(135deg,#fdfbf7_0%,#ffffff_55%,#f2c18d_100%)]",
  },
  "liquid-glass": {
    icon: Sparkles,
    description: "쿨 슬레이트 기반의 반투명 패널과 소프트 글로우를 적용합니다.",
    previewClassName:
      "bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.45),transparent_42%),linear-gradient(135deg,#0f172a_0%,#18253d_52%,#233556_100%)]",
  },
};

export function ThemeAppearanceSettings() {
  const { themePreference, setThemePreference, themePreset, setThemePreset } =
    useTheme();

  return (
    <section className="space-y-8">
      <div className="flex items-center gap-3 border-b border-background pb-4">
        <div className="rounded-xl bg-primary/10 p-2">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-headings font-bold text-text">
            테마 및 스타일
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            모드와 시각 프리셋을 조합해 Classic 또는 Liquid Glass 작업 환경을
            선택할 수 있습니다.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-base font-headings font-bold text-text">
            테마 모드
          </h3>
          <p className="mt-1 text-sm text-text-muted">
            System 설정은 OS의 다크모드 상태만 따라가고, 스타일 프리셋 선택에는
            영향을 주지 않습니다.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {THEME_OPTIONS.map((option) => {
            const meta = themeModeMeta[option];
            const Icon = meta.icon;
            const isActive = themePreference === option;

            return (
              <button
                key={option}
                type="button"
                onClick={() => setThemePreference(option)}
                className={cn(
                  "rounded-2xl border px-4 py-4 text-left transition-all duration-200",
                  isActive
                    ? "border-primary bg-primary/10 text-text shadow-soft"
                    : "border-background/70 bg-surface/80 text-text-muted hover:border-primary/20 hover:bg-surface",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <span
                      className={cn(
                        "inline-flex rounded-full p-2",
                        isActive
                          ? "bg-primary/15 text-primary"
                          : "bg-background/70 text-text-muted",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="font-headings text-sm font-bold text-text">
                        {THEME_LABELS[option]}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-text-muted">
                        {meta.description}
                      </p>
                    </div>
                  </div>
                  {isActive ? (
                    <Check className="mt-1 h-4 w-4 text-primary" />
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-base font-headings font-bold text-text">
            스타일 프리셋
          </h3>
          <p className="mt-1 text-sm text-text-muted">
            Classic은 기존 화면을 유지하고, Liquid Glass는 라이트/다크 양쪽에서
            반투명 유리 레이어를 적용합니다.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {THEME_VISUAL_PRESET_OPTIONS.map((preset) => {
            const meta = presetMeta[preset];
            const Icon = meta.icon;
            const isActive = themePreset === preset;

            return (
              <button
                key={preset}
                type="button"
                onClick={() => setThemePreset(preset)}
                className="border-none bg-transparent p-0 text-left"
              >
                <LiquidGlassFrame
                  interactive
                  mode={preset === "liquid-glass" ? "shader" : "prominent"}
                  overLight={preset === "liquid-glass" && isActive}
                  padding="16px"
                  cornerRadius={28}
                  style={{ width: "100%" }}
                  className={cn(
                    "rounded-[28px] border text-left transition-all duration-200",
                    isActive
                      ? "border-primary bg-primary/10 shadow-float"
                      : "border-background/70 bg-surface/80 hover:border-primary/20 hover:bg-surface",
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full p-2",
                          isActive
                            ? "bg-primary/15 text-primary"
                            : "bg-background/70 text-text-muted",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="font-headings text-base font-bold text-text">
                          {THEME_VISUAL_PRESET_LABELS[preset]}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-text-muted">
                          {meta.description}
                        </p>
                      </div>
                    </div>
                    {isActive ? (
                      <Check className="mt-1 h-4 w-4 shrink-0 text-primary" />
                    ) : null}
                  </div>

                  <div className="mt-4 rounded-[24px] border border-white/10 bg-background/40 p-3">
                    <div
                      className={cn(
                        "h-24 rounded-[20px]",
                        meta.previewClassName,
                      )}
                    />
                    <div className="mt-3 flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                      <div className="h-2.5 w-16 rounded-full bg-text/15" />
                      <div className="h-2.5 w-10 rounded-full bg-text/10" />
                    </div>
                  </div>
                </LiquidGlassFrame>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
