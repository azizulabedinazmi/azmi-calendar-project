import { Groq } from 'groq-sdk';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is not configured');
    }

    const origin = req.headers.get('origin') || '';
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
    
    if (origin !== baseUrl) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Invalid origin' },
        { status: 403 }
      );
    }

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });

    const { messages } = await req.json();

    const chatCompletion = await groq.chat.completions.create({
      messages,
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 1024,
      stream: false
    });

    return NextResponse.json({ 
      success: true, 
      response: chatCompletion.choices[0]?.message?.content 
    });

  } catch (error: any) {
    console.error('Groq API Error:', error);
    return NextResponse.json(
      {
        error: 'Groq API Error',
        message: error.message
      },
      { status: 500 }
    );
  }
}
