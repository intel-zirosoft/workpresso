'use client';

import { useTransition } from 'react';
import { RefreshCw, Save, Slack, UserRound } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type SlackIdentityUserRow = {
  id: string;
  name: string;
  department?: string | null;
  slackUserId?: string | null;
};

type SlackIdentityMappingFormProps = {
  users: SlackIdentityUserRow[];
  action: (formData: FormData) => Promise<void>;
};

export function SlackIdentityMappingForm({
  users,
  action,
}: SlackIdentityMappingFormProps) {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      try {
        await action(formData);
        alert('Slack 사용자 매핑을 저장했습니다.');
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Slack 사용자 매핑 저장에 실패했습니다.');
      }
    });
  };

  return (
    <div className="bg-white border border-background shadow-soft rounded-3xl p-8 transition-all hover:shadow-md space-y-6">
      <form action={handleSubmit} className="space-y-6">
        <div className="flex flex-col gap-3 border-b border-background pb-5">
          <div className="flex items-center gap-4">
            <div className="bg-primary/5 p-3 rounded-2xl">
              <Slack className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-headings font-bold text-text tracking-tight">
                Slack 사용자 매핑
              </h3>
              <p className="text-sm text-muted mt-1 font-body">
                DM 발송을 대비해 WorkPresso 사용자와 Slack Member ID를 수동으로 연결합니다.
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3 text-xs leading-6 text-muted-foreground font-body">
            Slack 프로필에서 <span className="font-bold text-text">멤버 ID 복사</span>로 확인한 값을 넣어주세요.
            예시: <span className="font-mono text-text">U012ABCDEF</span>
          </div>
        </div>

        <div className="space-y-4">
          {users.map((user) => (
            <div
              key={user.id}
              className="rounded-[24px] border border-background bg-background/30 p-4 md:p-5"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-text">
                    <UserRound className="w-4 h-4 text-primary/70" />
                    <span className="font-bold font-headings truncate">{user.name}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground font-body">
                    {user.department || '부서 미지정'}
                  </p>
                </div>

                <div className="w-full md:max-w-sm space-y-2">
                  <Label
                    htmlFor={`slackUserId:${user.id}`}
                    className="text-xs font-bold text-muted px-1"
                  >
                    Slack Member ID
                  </Label>
                  <Input
                    id={`slackUserId:${user.id}`}
                    name={`slackUserId:${user.id}`}
                    defaultValue={user.slackUserId ?? ''}
                    placeholder="U012ABCDEF"
                    className="rounded-pill bg-white border-transparent hover:border-primary/20 focus:border-primary focus:ring-4 focus:ring-primary/10 font-mono text-sm"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button
          type="submit"
          disabled={isPending}
          className="w-full rounded-pill h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-soft hover:shadow-md transition-all gap-2"
        >
          {isPending ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          매핑 저장
        </Button>
      </form>
    </div>
  );
}
