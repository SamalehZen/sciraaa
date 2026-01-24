import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    const arrayBuffer = await audioFile.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = audioFile.type || 'audio/webm';

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash-lite',
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 2048,
      },
    });

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Audio,
        },
      },
      'Transcribe this audio to text. Return ONLY the transcribed text, nothing else.',
    ]);

    const response = result.response;
    const text = response.text().trim();

    return NextResponse.json({ text });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Transcription failed' },
      { status: 500 }
    );
  }
}
