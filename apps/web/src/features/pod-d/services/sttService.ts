export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  const extension = (audioBlob.type.split("/")[1] || "wav").split(";")[0];
  const file = new File([audioBlob], `meeting.${extension}`, {
    type: audioBlob.type || "audio/wav",
  });
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/audio/transcribe", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error ?? "STT 처리 중 오류가 발생했습니다.");
  }

  const result = await response.json();
  return String(result.text ?? "").trim();
};
