import { Groq } from 'groq-sdk';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface RequestBody {
  messages: ChatMessage[];
}

export async function POST(req: Request) {
  try {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is not configured');
    }

    // Allow requests from both localhost and the deployed domain
    const origin = req.headers.get('origin') || '';
    const allowedOrigins = [
      'http://localhost:3000',
      'https://azmi-calendar-project.vercel.app',
      process.env.NEXT_PUBLIC_BASE_URL
    ].filter(Boolean);

    if (!allowedOrigins.includes(origin)) {
      console.warn('Invalid origin:', origin);
      return NextResponse.json(
        { error: 'Forbidden', message: 'Invalid origin' },
        { status: 403 }
      );
    }

    const { messages } = await req.json() as RequestBody;
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Messages array is required' },
        { status: 400 }
      );
    }

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });

    const chatCompletion = await groq.chat.completions.create({
      messages,
      model: "gemma2-9b-it",
      temperature: 0.7,
      max_tokens: 1024,
      stream: true
    });

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          for await (const chunk of chatCompletion) {
            const content = chunk.choices[0]?.delta?.content || '';
            controller.enqueue(encoder.encode(content));
          }
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      {
        error: 'Chat API Error',
        message: error.message || 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}
