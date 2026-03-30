'use client';

import React, { useTransition, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ShieldCheck, RefreshCw, KeyRound, Globe, Zap, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'password';
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

export function APIKeyForm({ title, description, fields, isActive, action, onTest }: APIKeyFormProps) {
  const [isPending, startTransition] = useTransition();
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      try {
        await action(formData);
        alert('설정이 성공적으로 저장되었습니다.');
      } catch (error) {
        alert(error instanceof Error ? error.message : '저장 실패');
      }
    });
  };

  const handleTest = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!onTest) return;

    const form = (e.target as HTMLElement).closest('form') as HTMLFormElement;
    const formData = new FormData(form);
    const config: Record<string, string> = {};
    
    fields.forEach(field => {
      config[field.name] = formData.get(field.name) as string;
    });

    try {
      setIsTesting(true);
      setTestResult(null);
      
      // onTest가 단일 인자(webhookUrl)를 받는지, 객체(config)를 받는지 확인
      // Slack은 단일 인자, Jira는 객체를 받으므로 대응
      const result = fields.length === 1 ? await onTest(config[fields[0].name]) : await onTest(config);
      setTestResult(result);
    } catch (error) {
      setTestResult({ 
        success: false, 
        message: error instanceof Error ? error.message : '연결 테스트 중 오류 발생' 
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="bg-white border border-background shadow-soft rounded-3xl p-8 transition-all hover:shadow-md">
      <form action={handleSubmit} className="space-y-6">
        <div className="flex justify-between items-start mb-8 pb-4 border-b border-background">
          <div className="flex items-center gap-4">
            <div className="bg-primary/5 p-3 rounded-2xl">
              <KeyRound className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-headings font-bold text-text tracking-tight">{title}</h3>
              <p className="text-sm text-muted mt-1 font-body">{description}</p>
            </div>
          </div>
          
          {isActive !== undefined && (
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all",
              isActive ? "bg-success/5 border-success/20 text-success" : "bg-muted/5 border-muted/20 text-muted"
            )}>
              <span className={cn(
                "w-2 h-2 rounded-full",
                isActive ? "bg-success animate-pulse" : "bg-muted"
              )} />
              <span className="text-[11px] font-bold uppercase tracking-wider">{isActive ? '시스템 활성' : '연결 중단'}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6">
          {fields.map((field) => (
            <div key={field.name} className="space-y-2.5">
              <Label htmlFor={field.name} className="text-sm font-bold text-muted px-4">{field.label}</Label>
              <div className="relative group">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
                <Input 
                  id={field.name}
                  name={field.name}
                  type={field.type}
                  defaultValue={field.defaultValue}
                  autoComplete={field.autoComplete}
                  className="rounded-pill bg-background/50 border-transparent hover:border-primary/20 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 h-12 pl-12 transition-all font-mono text-sm"
                  placeholder={field.placeholder ?? (field.type === 'password' ? '••••••••••••••••' : `${field.label} 입력`)}
                />
              </div>
              {field.description && (
                <p className="px-4 text-xs text-muted leading-relaxed">{field.description}</p>
              )}
            </div>
          ))}
        </div>
        
        {testResult && (
          <div className={cn(
            "p-4 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300 shadow-inner mt-4",
            testResult.success ? "bg-success/5 border border-success/10 text-success" : "bg-destructive/5 border border-destructive/10 text-destructive"
          )}>
            {testResult.success ? <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" /> : <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />}
            <p className="text-xs font-body leading-relaxed">{testResult.message}</p>
          </div>
        )}

        <div className="flex gap-4 pt-4">
          {onTest && (
            <Button 
              type="button"
              variant="outline"
              onClick={handleTest}
              disabled={isTesting}
              className="flex-1 rounded-pill h-11 border-primary/20 hover:bg-primary/5 hover:border-primary/40 text-primary font-bold transition-all gap-2"
            >
              {isTesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-primary" />}
              연결 테스트
            </Button>
          )}
          <Button 
            type="submit" 
            disabled={isPending} 
            className={cn(
              "rounded-pill h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-soft hover:shadow-md transition-all active:scale-95 gap-2",
              onTest ? "flex-1" : "w-full"
            )}
          >
            {isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            저장 및 활성화
          </Button>
        </div>
      </form>
    </div>
  );
}
