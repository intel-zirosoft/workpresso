'use client';

import { useMemo, useState, useTransition } from 'react';
import { Plus, RefreshCw, Save, Slack, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

type SlackIdentityUserRow = {
  id: string;
  name: string;
  department?: string | null;
};

type SlackIdentityMappingFormProps = {
  users: SlackIdentityUserRow[];
  slackMembers: Array<{ id: string; label: string }>;
  initialMappings: Array<{ userId: string; slackUserId: string }>;
  slackLoadError?: string | null;
  action: (formData: FormData) => Promise<void>;
};

type MappingRow = {
  localId: string;
  userId: string;
  slackUserId: string;
};

function createLocalId() {
  if (
    typeof globalThis.crypto !== 'undefined' &&
    typeof globalThis.crypto.randomUUID === 'function'
  ) {
    return globalThis.crypto.randomUUID();
  }

  return `mapping-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function createEmptyRow(): MappingRow {
  return {
    localId: createLocalId(),
    userId: '',
    slackUserId: '',
  };
}

export function SlackIdentityMappingForm({
  users,
  slackMembers,
  initialMappings,
  slackLoadError,
  action,
}: SlackIdentityMappingFormProps) {
  const [isPending, startTransition] = useTransition();
  const [rows, setRows] = useState<MappingRow[]>(
    initialMappings.length > 0
      ? initialMappings.map((mapping) => ({
          localId: createLocalId(),
          userId: mapping.userId,
          slackUserId: mapping.slackUserId,
        }))
      : [createEmptyRow()],
  );

  const userOptions = useMemo(
    () =>
      users.map((user) => ({
        value: user.id,
        label: user.department
          ? `${user.name} · ${user.department}`
          : user.name,
      })),
    [users],
  );

  function updateRow(localId: string, key: 'userId' | 'slackUserId', value: string) {
    setRows((current) =>
      current.map((row) =>
        row.localId === localId ? { ...row, [key]: value } : row,
      ),
    );
  }

  function addRow() {
    setRows((current) => [...current, createEmptyRow()]);
  }

  function removeRow(localId: string) {
    setRows((current) => {
      const nextRows = current.filter((row) => row.localId !== localId);
      return nextRows.length > 0 ? nextRows : [createEmptyRow()];
    });
  }

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
    <div className="bg-surface border border-background shadow-soft rounded-3xl p-6 transition-all hover:shadow-md space-y-5">
      <form action={handleSubmit} className="space-y-6">
        <div className="flex flex-col gap-3 border-b border-background pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/5 p-2.5 rounded-2xl">
              <Slack className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-headings font-bold text-text tracking-tight">
                Slack 사용자 매핑
              </h3>
              <p className="text-xs text-text-muted mt-1 font-body">
                WorkPresso 사용자와 Slack 멤버를 드롭다운으로 연결합니다.
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3 text-xs leading-6 text-text-muted font-body">
            Slack Bot Token으로 읽어온 멤버 목록을 사용합니다. DM 전송 대상 매핑을 빠르게 관리할 수 있습니다.
          </div>
        </div>

        {slackLoadError ? (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-xs leading-6 text-destructive font-body">
            {slackLoadError}
          </div>
        ) : null}

        <div className="space-y-2">
          <div className="hidden md:grid md:grid-cols-[1fr_1fr_auto] md:items-center md:gap-4 px-1 text-xs font-bold text-text-muted">
            <span>WorkPresso 사용자</span>
            <span>Slack 사용자</span>
            <span className="sr-only">삭제</span>
          </div>

          {rows.map((row) => (
            <div
              key={row.localId}
              className="rounded-[24px] border border-background bg-background/30 p-2"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <select
                      id={`mappingUserId:${row.localId}`}
                      name={`mappingUserId:${row.localId}`}
                      value={row.userId}
                      onChange={(event) =>
                        updateRow(row.localId, 'userId', event.target.value)
                      }
                      className="w-full rounded-pill border border-transparent bg-surface px-4 py-3 text-sm font-body outline-none transition-all hover:border-primary/20 focus:border-primary focus:ring-4 focus:ring-primary/10"
                    >
                      <option value="">사용자 선택</option>
                      {userOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <select
                      id={`mappingSlackUserId:${row.localId}`}
                      name={`mappingSlackUserId:${row.localId}`}
                      value={row.slackUserId}
                      onChange={(event) =>
                        updateRow(row.localId, 'slackUserId', event.target.value)
                      }
                      className="w-full rounded-pill border border-transparent bg-surface px-4 py-3 text-sm font-body outline-none transition-all hover:border-primary/20 focus:border-primary focus:ring-4 focus:ring-primary/10"
                      disabled={slackMembers.length === 0}
                    >
                      <option value="">
                        {slackMembers.length === 0 ? 'Slack 사용자 없음' : 'Slack 사용자 선택'}
                      </option>
                      {slackMembers.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full text-text-muted hover:text-destructive hover:bg-destructive/5"
                  onClick={() => removeRow(row.localId)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 md:flex-row">
          <Button
            type="button"
            variant="outline"
            className="rounded-pill h-11 border-primary/20 text-primary hover:bg-primary/5 hover:border-primary/40 gap-2"
            onClick={addRow}
          >
            <Plus className="w-4 h-4" />
            매핑 행 추가
          </Button>

          <Button
            type="submit"
            disabled={isPending}
            className="flex-1 rounded-pill h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-soft hover:shadow-md transition-all gap-2"
          >
            {isPending ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            매핑 저장
          </Button>
        </div>
      </form>
    </div>
  );
}
