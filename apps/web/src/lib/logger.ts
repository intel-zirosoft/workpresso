type LogLevel = 'info' | 'warn' | 'error';

export const logger = {
  log: async (level: LogLevel, message: string, details?: any) => {
    const timestamp = new Date().toISOString();
    
    // 1. 브라우저 콘솔에도 출력
    if (level === 'error') console.error(`[${level}] ${message}`, details);
    else console.log(`[${level}] ${message}`, details);

    // 2. API를 통해 서버 파일에 기록
    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level,
          message,
          details,
          timestamp,
        }),
      });
    } catch (e) {
      console.error('Failed to send log to server:', e);
    }
  },

  info: (message: string, details?: any) => logger.log('info', message, details),
  warn: (message: string, details?: any) => logger.log('warn', message, details),
  error: (message: string, details?: any) => logger.log('error', message, details),
};
