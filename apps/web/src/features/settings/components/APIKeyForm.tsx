'use client';

import { useTransition } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ShieldCheck, RefreshCw, KeyRound, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'password';
  defaultValue?: string;
}

interface APIKeyFormProps {
  title: string;
  description: string;
  fields: FormField[];
  isActive?: boolean;
  action: (formData: FormData) => Promise<void>;
}

export function APIKeyForm({ title, description, fields, isActive, action }: APIKeyFormProps) {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      try {
        await action(formData);
      } catch (error) {
        alert(error instanceof Error ? error.message : '저장 실패');
      }
    });
  };

  return (
    <div className="bg-white border border-background shadow-soft rounded-3xl p-8 transition-all hover:shadow-md">
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

      <form action={handleSubmit} className="space-y-6">
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
                  className="rounded-pill bg-background/50 border-transparent hover:border-primary/20 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 h-12 pl-12 transition-all font-mono text-sm"
                  placeholder={field.type === 'password' ? '••••••••••••••••' : 'Provider명을 입력하세요'}
                />
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex justify-end pt-4">
          <Button 
            type="submit" 
            disabled={isPending} 
            className="rounded-pill px-8 h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-soft hover:shadow-md transition-all active:scale-95 gap-2"
          >
            {isPending ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            {isPending ? '저장 중...' : '구성 업데이트'}
          </Button>
        </div>
      </form>
    </div>
  );
}
