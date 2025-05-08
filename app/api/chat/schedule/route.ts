import { Groq } from 'groq-sdk';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

const SYSTEM_PROMPT = `
You are an intelligent scheduling assistant, specializing in helping users create and optimize calendar events. Please generate appropriate scheduling based on user prompts.

Output requirements:
1. Must return pure JSON format, without any Markdown symbols or additional explanations
2. Only include fields explicitly mentioned in the user prompt or that can be reasonably inferred
3. Time format must be ISO string (YYYY-MM-DDTHH:mm)
4. Participants format should be comma-separated strings

Example output:
{
  "title": "Team Meeting",
  "startDate": "2025-05-29T10:00:00",
  "endDate": "2025-05-29T11:00:00",
  "location": "Meeting Room A",
  "participants": "John Doe,Jane Smith",
  "description": "Discuss project progress"
}

Only title and dates are required fields; others are optional. You need to generate them according to the user's requirements. However, if there is no location, for example, return an empty string for location rather than omitting the location field.
`;

interface RequestBody {
  prompt: string;
  currentValues: {
    title?: string;
    startDate?: string;
    endDate?: string;
    location?: string;
    participants?: string;
    description?: string;
  };
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

    const { prompt, currentValues } = await req.json() as RequestBody;
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Prompt is required' },
        { status: 400 }
      );
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Current values: ${JSON.stringify(currentValues)}\nUser prompt: ${prompt}` }
      ],
      model: 'mixtral-8x7b-32768',
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const result = completion.choices[0]?.message?.content;
    if (!result) {
      throw new Error('AI did not return valid content');
    }

    try {
      const parsedResult = JSON.parse(result);
      return NextResponse.json(
        { data: parsedResult },
        {
          headers: {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        }
      );
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      throw new Error('Invalid AI response format');
    }

  } catch (error: any) {
    console.error('Schedule API Error:', error);
    return NextResponse.json(
      { 
        error: 'Schedule API Error',
        message: error.message || 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS(req: Request) {
  const origin = req.headers.get('origin') || '';
  const allowedOrigins = [
    'http://localhost:3000',
    'https://azmi-calendar-project.vercel.app',
    process.env.NEXT_PUBLIC_BASE_URL
  ].filter(Boolean);

  if (!allowedOrigins.includes(origin)) {
    return new Response(null, { status: 403 });
  }

  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
