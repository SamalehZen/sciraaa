import { NextRequest, NextResponse } from 'next/server';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

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

    const model = google('gemini-2.5-flash');

    const { text } = await generateText({
      model,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'file',
              data: base64Audio,
              mimeType: mimeType,
            },
            {
              type: 'text',
              text: 'Transcris cet audio en texte. Retourne UNIQUEMENT le texte transcrit, sans commentaires ni explications. Si l\'audio est en français, transcris en français. Si l\'audio est en anglais, transcris en anglais. Garde la langue originale.',
            },
          ],
        },
      ],
    });

    return NextResponse.json({ text: text.trim() });
  } catch (error: any) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { error: error.message || 'Transcription failed' },
      { status: 500 }
    );
  }
}
