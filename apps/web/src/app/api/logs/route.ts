import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  // ... (POST implementation)
  try {
    const { level, message, details, timestamp } = await request.json();
    const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}\nDetails: ${JSON.stringify(details, null, 2)}\n${'-'.repeat(50)}\n`;
    const logDir = path.join(process.cwd(), 'logs');
    const logFile = path.join(logDir, 'dev_error_logs.txt');
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);
    fs.appendFileSync(logFile, logEntry);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function GET() {
  try {
    const logFile = path.join(process.cwd(), 'logs', 'dev_error_logs.txt');
    if (!fs.existsSync(logFile)) {
      return new Response('No logs found.', { status: 200 });
    }
    const content = fs.readFileSync(logFile, 'utf-8');
    return new Response(content, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (error) {
    return new Response('Error reading logs.', { status: 500 });
  }
}
