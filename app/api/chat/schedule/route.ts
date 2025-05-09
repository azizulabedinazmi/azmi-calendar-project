import { Groq } from 'groq-sdk';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

const SYSTEM_PROMPT = `
You are an intelligent schedule assistant that helps users create and optimize calendar events. Please generate a suitable schedule based on user prompts.

Output requirements:
1. Must return pure JSON format without any Markdown symbols or additional explanations
2. Contain only fields that are explicitly mentioned in the user prompt or can be reasonably inferred
3. The time format must be an ISO string (YYYY-MM-DDTHH:mm)
4. The participant format is a comma-separated string

Sample output:
{
"title": "Team meeting",
"startDate": "2025-04-29T10:00:00",
"endDate": "2025-04-29T11:00:00",
"location": "Conference Room A",
"participants": "Zhang San, Li Si",
"description": "Discuss project progress"
}

Only title and date are required, the others are optional. You need to generate them according to the user's requirements. But for example, if there is no location, then location will return an empty string instead of not outputting location.
`;

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

    const { prompt, currentValues } = await req.json();
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Current Value: ${JSON.stringify(currentValues)}\nUser Tips: ${prompt}` }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const result = completion.choices[0]?.message?.content;
    if (!result) throw new Error('AI did not return valid content');

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
