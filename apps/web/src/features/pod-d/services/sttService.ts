/**
 * Gemini API를 사용한 STT(Speech-to-Text) 서비스
 * Gemini 1.5 모델은 오디오 파일을 직접 입력받아 텍스트로 변환할 수 있습니다.
 */

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
const GEMINI_MODEL = 'gemini-1.5-flash';

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
                  mime_type: audioBlob.type || 'audio/wav',
                  data: base64Audio,
                },
              },
              {
                text: '이 오디오의 내용을 한글로 정확하게 받아쓰기해줘. 다른 말은 하지 말고 받아쓰기 내용만 출력해줘.',
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
