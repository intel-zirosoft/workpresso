"use client";

import React, { useTransition, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  ShieldCheck,
  RefreshCw,
  KeyRound,
  Globe,
  Zap,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FormField {
  name: string;
  label: string;
  type: "text" | "password";
  defaultValue?: string;
  description?: string;
  placeholder?: string;
  autoComplete?: string;
}

interface APIKeyFormProps {
  title: string;
  description: string;
  fields: FormField[];
  isActive?: boolean;
  action: (formData: FormData) => Promise<void>;
  onTest?: (config: any) => Promise<{ success: boolean; message: string }>;
}

export function APIKeyForm({
  title,
  description,
  fields,
  isActive,
  action,
  onTest,
}: APIKeyFormProps) {
  const [isPending, startTransition] = useTransition();
  const [isTesting, setIsTesting] = useState(false);
  const [status, setStatus] = useState<{
    success: boolean;
    message: string;
    type: "test" | "save";
  } | null>(null);
  const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>({});

  const toggleVisibility = (fieldName: string) => {
    setVisibleFields((prev) => ({ ...prev, [fieldName]: !prev[fieldName] }));
  };

  const handleSubmit = (formData: FormData) => {
    setStatus(null);
    startTransition(async () => {
      try {
        await action(formData);
        setStatus({
          success: true,
          message: "설정이 성공적으로 저장 및 활성화되었습니다.",
          type: "save",
        });
      } catch (error) {
        setStatus({
          success: false,
          message: error instanceof Error ? error.message : "저장 실패",
          type: "save",
        });
      }
    });
  };

  const handleTest = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!onTest) return;

    const form = (e.target as HTMLElement).closest("form") as HTMLFormElement;
    const formData = new FormData(form);
    const config: Record<string, string> = {};

    fields.forEach((field) => {
      config[field.name] = formData.get(field.name) as string;
    });

    try {
      setIsTesting(true);
      setStatus(null);

      const result =
        fields.length === 1
          ? await onTest(config[fields[0].name])
          : await onTest(config);
      setStatus({ ...result, type: "test" });
    } catch (error) {
      setStatus({
        success: false,
        message:
          error instanceof Error ? error.message : "연결 테스트 중 오류 발생",
        type: "test",
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="bg-surface border border-background shadow-soft rounded-3xl p-8 transition-all hover:shadow-md h-full flex flex-col">
      <form action={handleSubmit} className="space-y-6 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-8 pb-4 border-b border-background">
          <div className="flex items-center gap-4">
            <div className="bg-primary/5 p-3 rounded-2xl">
              <KeyRound className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-headings font-bold text-text tracking-tight">
                {title}
              </h3>
              <p className="text-sm text-text-muted mt-1 font-body">{description}</p>
            </div>
          </div>

          {isActive !== undefined && (
            <div
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all",
                isActive
                  ? "bg-success/5 border-success/20 text-success"
                  : "bg-background/70 border-background text-text-muted",
              )}
            >
              <span
                className={cn(
                  "w-2 h-2 rounded-full",
                  isActive ? "bg-success animate-pulse" : "bg-muted",
                )}
              />
              <span className="text-[11px] font-bold uppercase tracking-wider">
                {isActive ? "시스템 활성" : "연결 중단"}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 flex-1">
          {fields.map((field) => (
            <div key={field.name} className="space-y-2.5">
                <Label
                  htmlFor={field.name}
                  className="text-sm font-bold text-text-muted px-4"
                >
                {field.label}
              </Label>
              <div className="relative group">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-primary transition-colors" />
                <Input
                  id={field.name}
                  name={field.name}
                  type={
                    field.type === "password" && visibleFields[field.name]
                      ? "text"
                      : field.type
                  }
                  defaultValue={field.defaultValue}
                  autoComplete={field.autoComplete}
                  className="rounded-pill bg-background/50 border-transparent hover:border-primary/20 focus:border-primary focus:bg-surface focus:ring-4 focus:ring-primary/10 h-12 pl-12 pr-12 transition-all font-mono text-sm"
                  placeholder={
                    field.placeholder ??
                    (field.type === "password"
                      ? "••••••••••••••••"
                      : `${field.label} 입력`)
                  }
                />
                {field.type === "password" && (
                  <button
                    type="button"
                    onClick={() => toggleVisibility(field.name)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary transition-colors p-1"
                  >
                    {visibleFields[field.name] ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
              {field.description && (
                <p className="px-4 text-xs text-text-muted leading-relaxed">
                  {field.description}
                </p>
              )}
            </div>
          ))}
        </div>

        {status && (
          <div
            className={cn(
              "p-4 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300 shadow-inner mt-4",
              status.success
                ? "bg-success/5 border border-success/10 text-success"
                : "bg-destructive/5 border border-destructive/10 text-destructive",
            )}
          >
            {status.success ? (
              <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
            )}
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                {status.type === "test" ? "연결 테스트 결과" : "저장 및 활성화 상태"}
              </span>
              <p className="text-xs font-body leading-relaxed">{status.message}</p>
            </div>
          </div>
        )}

        <div className="flex gap-4 pt-4 mt-auto">
          {onTest && (
            <Button
              type="button"
              variant="outline"
              onClick={handleTest}
              disabled={isTesting || isPending}
              className="flex-1 rounded-pill h-11 border-primary/20 hover:bg-primary/5 hover:border-primary/40 text-primary font-bold transition-all gap-2"
            >
              {isTesting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 fill-primary" />
              )}
              연결 테스트
            </Button>
          )}
          <Button
            type="submit"
            disabled={isPending || isTesting}
            className={cn(
              "rounded-pill h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-soft hover:shadow-md transition-all active:scale-95 gap-2",
              onTest ? "flex-1" : "w-full",
            )}
          >
            {isPending ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            저장 및 활성화
          </Button>
        </div>
      </form>
    </div>
  );
}
