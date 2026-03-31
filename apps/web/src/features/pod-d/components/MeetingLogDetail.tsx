"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { WaveformVisualizer } from "./WaveformVisualizer";
import {
  Calendar,
  User as UserIcon,
  FileText,
  CheckCircle2,
  ListTodo,
  Users,
  MessageSquareText,
  Download,
  FileDown,
  Edit2,
  Save,
  X,
  Plus,
  Trash2,
  Zap,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateMeetingLog } from "../services/meetingLogService";
import { syncActionItemToJiraServer } from "../services/meetingLogAction";

interface MeetingLogDetailProps {
  log: {
    id: string;
    created_at: string;
    audio_url: string;
    stt_text: string | null;
    title: string | null;
    summary: string | null;
    action_items: any[] | null;
    participants: string[] | null;
    is_refined: boolean;
    owner_id?: string;
  };
}

export const MeetingLogDetail: React.FC<MeetingLogDetailProps> = ({
  log: initialLog,
}) => {
  const [log, setLog] = React.useState(initialLog);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedLog, setEditedLog] = React.useState(initialLog);
  const [isSaving, setIsSaving] = React.useState(false);
  const [syncingIndex, setSyncingIndex] = React.useState<number | null>(null);

  const handleSyncToJira = async (index: number, item: any) => {
    try {
      setSyncingIndex(index);

      // 서버에서 Jira 생성 + DB 저장을 원자적으로 처리
      const result = await syncActionItemToJiraServer(
        log.id,
        index,
        item.task,
        item.assignee,
        item.due_date,
      );

      if (result.success) {
        if (result.alreadySynced) {
          alert(`이미 연결된 Jira 이슈입니다: ${result.issueKey}`);
        } else {
          alert(`Jira 이슈 생성 완료: ${result.issueKey}`);
        }

        // 서버가 반환한 최신 items로 로컬 상태만 업데이트 (DB 저장은 이미 완료)
        setLog((prev) => ({
          ...prev,
          action_items: result.updatedItems ?? prev.action_items,
        }));
      }
    } catch (error) {
      console.error("Jira sync failed:", error);
      alert(error instanceof Error ? error.message : "Jira 동기화에 실패했습니다.");
    } finally {
      setSyncingIndex(null);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const updated = await updateMeetingLog(log.id, {
        title: editedLog.title,
        summary: editedLog.summary,
        participants: editedLog.participants,
        action_items: editedLog.action_items,
      });
      setLog(updated);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save log:", error);
      alert("저장 도중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedLog(log);
    setIsEditing(false);
  };

  const handleActionItemChange = (
    index: number,
    field: string,
    value: string,
  ) => {
    const newItems = [...(editedLog.action_items || [])];
    newItems[index] = { ...newItems[index], [field]: value };
    setEditedLog({ ...editedLog, action_items: newItems });
  };

  const addActionItem = () => {
    const newItems = [
      ...(editedLog.action_items || []),
      { task: "", assignee: "", due_date: "" },
    ];
    setEditedLog({ ...editedLog, action_items: newItems });
  };

  const removeActionItem = (index: number) => {
    const newItems = (editedLog.action_items || []).filter(
      (_, i) => i !== index,
    );
    setEditedLog({ ...editedLog, action_items: newItems });
  };
  const handleDownload = () => {
    const dateStr = new Date(log.created_at).toLocaleString();
    const content = `# ${log.title || "회의록"}
**회의 일시:** ${dateStr}
**참여자:** ${log.participants?.join(", ") || "없음"}

## 📝 회의 요약
${log.summary || "요약 내용이 없습니다."}

## ✅ 주요 액션 아이템
${
  log.action_items && log.action_items.length > 0
    ? log.action_items
        .map(
          (item: any) =>
            `- [ ] ${item.task}${item.assignee ? ` (담당: ${item.assignee})` : ""}${item.due_date ? ` (기한: ${item.due_date})` : ""}`,
        )
        .join("\n")
    : "도출된 액션 아이템이 없습니다."
}

---
## 🎙️ STT 원본 (원본 텍스트)
${log.stt_text || "기록된 텍스트가 없습니다."}

---
*WorkPresso AI를 통해 생성된 회의록입니다.*
`;

    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${log.title || "meeting_log"}_${new Date(log.created_at).toISOString().split("T")[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="p-10 bg-white shadow-soft border border-background/50 rounded-3xl flex flex-col gap-10 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted text-sm font-body">
            <Calendar className="w-4 h-4" />
            <span>{new Date(log.created_at).toLocaleString()} 회의</span>
          </div>
          <div className="flex items-center gap-3">
            {!isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="rounded-pill gap-2 text-xs border-primary/20 hover:bg-primary/5 h-9 px-4 h-9 font-bold"
                >
                  <Edit2 className="w-3.5 h-3.5" /> 수정하기
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="rounded-pill gap-2 text-xs border-primary/20 hover:bg-primary/5 h-9 px-4 h-9 font-bold"
                >
                  <FileDown className="w-3.5 h-3.5" /> 다운로드 (Markdown)
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  className="rounded-pill gap-2 text-xs text-muted h-9 px-4 font-bold"
                >
                  <X className="w-3.5 h-3.5" /> 취소
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="rounded-pill gap-2 text-xs bg-success hover:bg-success/90 text-white h-9 px-6 shadow-md font-bold"
                >
                  {isSaving ? (
                    <span className="animate-spin text-sm">⏳</span>
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}{" "}
                  저장하기
                </Button>
              </>
            )}
            {log.is_refined && (
                <Badge className="bg-success/10 text-success border-success/20 gap-1.5 px-4 py-1.5 rounded-pill shadow-sm">
                  <CheckCircle2 className="w-3.5 h-3.5" /> AI 전환 완료
                </Badge>
            )}
          </div>
        </div>
        {isEditing ? (
          <Input
            value={editedLog.title || ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setEditedLog({ ...editedLog, title: e.target.value })
            }
            className="text-3xl font-headings font-bold h-auto py-2 bg-transparent border-b border-primary/30 focus-visible:ring-0 rounded-none"
            placeholder="제목을 입력하세요"
          />
        ) : (
          <h2 className="text-3xl font-headings font-bold text-foreground">
            {log.title || "회의록 상세"}
          </h2>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-headings font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            음성 다시 듣기
          </h3>
          <WaveformVisualizer audioUrl={log.audio_url} />
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-headings font-semibold flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            참여자
          </h3>
          <div className="p-6 bg-background/50 border border-background rounded-2xl flex flex-wrap gap-2 min-h-[70px] shadow-inner">
            {isEditing ? (
              <Input
                value={editedLog.participants?.join(", ") || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditedLog({
                    ...editedLog,
                    participants: e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter((s) => s),
                  })
                }
                className="w-full text-sm"
                placeholder="쉼표(,)로 구분하여 입력하세요"
              />
            ) : log.participants && log.participants.length > 0 ? (
              log.participants.map((name, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="rounded-full px-3"
                >
                  {name}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-muted italic">
                식별된 참여자가 없습니다.
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* 요약 */}
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-headings font-semibold flex items-center gap-2">
            <MessageSquareText className="w-5 h-5 text-primary" />
            회의 핵심 요약
          </h3>
          {isEditing ? (
            <Textarea
              value={editedLog.summary || ""}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setEditedLog({ ...editedLog, summary: e.target.value })
              }
              className="min-h-[150px] font-body text-foreground bg-primary/5 border-primary/10"
              placeholder="회의 요약을 입력하세요"
            />
          ) : (
            <div className="p-8 bg-white/50 border border-background rounded-2xl font-body leading-relaxed text-foreground shadow-sm animate-in fade-in duration-700">
              {log.summary || (
                <span className="text-muted italic">
                  AI 요약 결과가 없습니다. 정제 중이거나 분석에 실패했습니다.
                </span>
              )}
            </div>
          )}
        </div>

        {/* 액션 아이템 */}
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-headings font-semibold flex items-center gap-2">
            <ListTodo className="w-5 h-5 text-primary" />
            주요 액션 아이템
          </h3>
          <div className="space-y-3">
            {isEditing ? (
              <>
                {(editedLog.action_items || []).map((item: any, i) => (
                  <div
                    key={i}
                    className="flex flex-col gap-2 p-5 bg-white rounded-2xl border border-background relative group/item shadow-sm hover:shadow-md transition-all slide-in-from-top-2 duration-300"
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeActionItem(i)}
                      className="absolute top-2 right-2 h-7 w-7 p-0 rounded-full hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover/item:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                    <Input
                      value={item.task}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleActionItemChange(i, "task", e.target.value)
                      }
                      placeholder="할 일 제목"
                      className="text-sm font-medium border-none p-0 focus-visible:ring-0 bg-transparent h-auto"
                    />
                    <div className="flex gap-4">
                      <div className="flex items-center gap-1 border-b border-dashed border-muted/50">
                        <UserIcon className="w-3 h-3 text-muted" />
                        <Input
                          value={item.assignee || ""}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            handleActionItemChange(
                              i,
                              "assignee",
                              e.target.value,
                            )
                          }
                          placeholder="담당자"
                          className="text-xs h-6 p-0 w-24 border-none focus-visible:ring-0 bg-transparent"
                        />
                      </div>
                      <div className="flex items-center gap-1 border-b border-dashed border-muted/50">
                        <Calendar className="w-3 h-3 text-muted" />
                        <Input
                          value={item.due_date || ""}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            handleActionItemChange(
                              i,
                              "due_date",
                              e.target.value,
                            )
                          }
                          placeholder="기한"
                          className="text-xs h-6 p-0 w-32 border-none focus-visible:ring-0 bg-transparent"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addActionItem}
                  className="w-full border-dashed rounded-2xl py-6 text-muted hover:text-primary hover:border-primary/50 bg-white/50 hover:bg-white transition-all font-bold shadow-sm"
                >
                  <Plus className="w-4 h-4 mr-2" /> 액션 아이템 추가
                </Button>
              </>
            ) : log.action_items && log.action_items.length > 0 ? (
              log.action_items.map((item: any, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-background shadow-sm hover:shadow-md transition-all active:scale-[0.99]"
                >
                  <div className="flex items-start gap-4 flex-1">
                    <div className="mt-1 w-4 h-4 rounded-full border-2 border-primary/30" />
                    <div className="flex-1">
                      <p className="font-medium">{item.task}</p>
                      <div className="flex gap-4 mt-1">
                        {item.assignee && (
                          <span className="text-xs text-muted flex items-center gap-1">
                            <UserIcon className="w-3 h-3" /> 담당: {item.assignee}
                          </span>
                        )}
                        {item.due_date && (
                          <span className="text-xs text-muted flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> 기한: {item.due_date}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.jira_key ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="text-xs text-primary font-bold hover:bg-primary/5 h-8 gap-1.5"
                      >
                        <a href={item.jira_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3 h-3" /> {item.jira_key}
                        </a>
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={syncingIndex === i}
                        onClick={() => handleSyncToJira(i, item)}
                        className="text-xs border-primary/30 hover:bg-primary/5 h-8 gap-1.5 font-bold rounded-full transition-all"
                      >
                        {syncingIndex === i ? (
                          <span className="animate-spin text-sm">⏳</span>
                        ) : (
                          <Zap className="w-3 h-3 text-primary fill-primary" />
                        )}
                        Jira 전송
                      </Button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 bg-background border border-dashed rounded-lg text-center text-muted text-sm">
                도출된 액션 아이템이 없습니다.
              </div>
            )}
          </div>
        </div>

        {/* 원본 텍스트 */}
        <div className="flex flex-col gap-4 mt-4">
          <h3 className="text-lg font-headings font-semibold flex items-center gap-2 text-muted">
            <FileText className="w-5 h-5 text-muted-foreground/60" />
            STT 원본 텍스트
          </h3>
          <div className="p-8 bg-background/50 border border-background rounded-2xl text-sm font-body leading-relaxed text-muted-foreground whitespace-pre-wrap max-h-[350px] overflow-y-auto custom-scrollbar shadow-inner mt-2">
            {log.stt_text || "기록된 텍스트가 없습니다."}
          </div>
        </div>
      </div>
    </Card>
  );
};
