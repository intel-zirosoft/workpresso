"use client";

import type { CSSProperties, ReactNode } from "react";

import LiquidGlass from "@/vendor/liquid-glass-react";
import { useTheme } from "@/providers/theme-provider";
import { cn } from "@/lib/utils";

type LiquidGlassMode = "standard" | "polar" | "prominent" | "shader";

type LiquidGlassFrameProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  padding?: string;
  cornerRadius?: number;
  mode?: LiquidGlassMode;
  overLight?: boolean;
  interactive?: boolean;
};

export function LiquidGlassFrame({
  children,
  className,
  style,
  padding = "18px 20px",
  cornerRadius = 28,
  mode = "prominent",
  overLight = false,
  interactive = false,
}: LiquidGlassFrameProps) {
  const { themePreset } = useTheme();

  if (themePreset !== "liquid-glass") {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  return (
    <LiquidGlass
      className={cn("liquid-glass-native", className)}
      style={style}
      padding={padding}
      cornerRadius={cornerRadius}
      mode={mode}
      overLight={overLight}
      onClick={interactive ? () => undefined : undefined}
      displacementScale={mode === "prominent" ? 84 : 72}
      blurAmount={0.085}
      saturation={170}
      aberrationIntensity={mode === "prominent" ? 3.4 : 2.6}
      elasticity={interactive ? 0.22 : 0.16}
    >
      {children}
    </LiquidGlass>
  );
}
