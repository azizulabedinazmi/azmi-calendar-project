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
  "startDate": "2025-04-29T10:00:00",
  "endDate": "2025-04-29T11:00:00",
  "location": "Meeting Room A",
  "participants": "John Doe,Jane Smith",
  "description": "Discuss project progress"
}

Only title and dates are required fields; others are optional. You need to generate them according to the user's requirements. However, if there is no location, for example, return an empty string for location rather than omitting the location field.
`;

export async function POST(req: Request) {
  try {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY未配置');
    }

    const origin = req.headers.get('origin') || '';
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';

    if (origin !== baseUrl) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Invalid origin' },
        { status: 403 }
      );
    }

    const { prompt, currentValues } = await req.json();
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `当前值: ${JSON.stringify(currentValues)}\n用户提示: ${prompt}` }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const result = completion.choices[0]?.message?.content;
    if (!result) throw new Error('AI未返回有效内容');

    return NextResponse.json({ 
      data: JSON.parse(result) 
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
