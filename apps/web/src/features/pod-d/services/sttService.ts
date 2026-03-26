/**
 * Gemini API를 사용한 STT(Speech-to-Text) 서비스
 * Gemini 1.5 모델은 오디오 파일을 직접 입력받아 텍스트로 변환할 수 있습니다.
 */

export const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
export const GEMINI_MODEL = 'gemini-2.5-flash';

export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API Key is missing. Please check your environment variables.');
  }

  // Blob을 Base64로 변환
  const base64Audio = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(audioBlob);
  });

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inline_data: {
                  mime_type: (audioBlob.type || 'audio/wav').split(';')[0],
                  data: base64Audio,
                },
              },
              {
                text: '이 오디오의 내용을 한글로 정확하게 받아쓰기(STT) 해. 아무런 부연 설명이나 요약 없이, 오로지 들리는 음성 그대로 텍스트만 출력해. 만약 음성이 전혀 들리지 않거나 잡음만 있다면 "음성이 인식되지 않았습니다."라고만 출력해.',
              },
            ],
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Gemini API Error: ${errorData.error?.message || response.statusText}`);
  }

  const result = await response.json();
  const transcription = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

  return transcription.trim();
};
