'use client';

import { useTransition } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

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
    <div className="bg-background border border-border/50 rounded-2xl p-6 shadow-sm">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-headings font-bold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
        {isActive !== undefined && (
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-success' : 'bg-muted'}`} />
            <span className="text-xs font-medium text-muted-foreground">{isActive ? '활성화됨' : '비활성'}</span>
          </div>
        )}
      </div>

      <form action={handleSubmit} className="space-y-4">
        {fields.map((field) => (
          <div key={field.name} className="space-y-1.5">
            <Label htmlFor={field.name} className="text-xs text-muted-foreground">{field.label}</Label>
            <Input 
              id={field.name}
              name={field.name}
              type={field.type}
              defaultValue={field.defaultValue}
              className="rounded-xl font-mono text-sm"
              placeholder={field.type === 'password' ? '********' : ''}
            />
          </div>
        ))}
        
        <div className="pt-2">
          <Button type="submit" disabled={isPending} className="rounded-xl" size="sm">
            {isPending ? '저장 중...' : '설정 저장'}
          </Button>
        </div>
      </form>
    </div>
  );
}
