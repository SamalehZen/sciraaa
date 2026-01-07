import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

type STTProvider = 'openai' | 'assemblyai' | 'deepgram';

const ASSEMBLYAI_API_URL = 'https://api.assemblyai.com/v2';
const DEEPGRAM_API_URL = 'https://api.deepgram.com/v1/listen';
const OPENAI_API_URL = 'https://api.openai.com/v1/audio/transcriptions';

async function transcribeWithOpenAI(audioBlob: Blob, filename: string): Promise<string> {
  const apiKey = process.env.OPENAI_STT_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_STT_API_KEY is not configured');
  }

  const formData = new FormData();
  formData.append('file', audioBlob, filename);
  formData.append('model', 'gpt-4o-mini-transcribe');
  formData.append('response_format', 'json');

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenAI transcription error:', errorText);
    throw new Error(`OpenAI transcription failed: ${response.status}`);
  }

  const data = await response.json();
  return data.text || '';
}

async function transcribeWithAssemblyAI(audioBlob: Blob): Promise<string> {
  const apiKey = process.env.ASSEMBLYAI_API_KEY;
  if (!apiKey) {
    throw new Error('ASSEMBLYAI_API_KEY is not configured');
  }

  const uploadResponse = await fetch(`${ASSEMBLYAI_API_URL}/upload`, {
    method: 'POST',
    headers: {
      'Authorization': apiKey,
      'Content-Type': 'application/octet-stream',
    },
    body: audioBlob,
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    console.error('AssemblyAI upload error:', errorText);
    throw new Error(`AssemblyAI upload failed: ${uploadResponse.status}`);
  }

  const uploadData = await uploadResponse.json();
  const audioUrl = uploadData.upload_url;

  const transcriptResponse = await fetch(`${ASSEMBLYAI_API_URL}/transcript`, {
    method: 'POST',
    headers: {
      'Authorization': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      audio_url: audioUrl,
      language_detection: true,
    }),
  });

  if (!transcriptResponse.ok) {
    const errorText = await transcriptResponse.text();
    console.error('AssemblyAI transcript creation error:', errorText);
    throw new Error(`AssemblyAI transcript creation failed: ${transcriptResponse.status}`);
  }

  const transcriptData = await transcriptResponse.json();
  const transcriptId = transcriptData.id;

  let result = transcriptData;
  while (result.status !== 'completed' && result.status !== 'error') {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    const pollingResponse = await fetch(`${ASSEMBLYAI_API_URL}/transcript/${transcriptId}`, {
      headers: {
        'Authorization': apiKey,
      },
    });

    if (!pollingResponse.ok) {
      throw new Error(`AssemblyAI polling failed: ${pollingResponse.status}`);
    }

    result = await pollingResponse.json();
  }

  if (result.status === 'error') {
    throw new Error(`AssemblyAI transcription error: ${result.error}`);
  }

  return result.text || '';
}

async function transcribeWithDeepgram(audioBlob: Blob, contentType: string): Promise<string> {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    throw new Error('DEEPGRAM_API_KEY is not configured');
  }

  const params = new URLSearchParams({
    model: 'nova-2',
    detect_language: 'true',
    punctuate: 'true',
    smart_format: 'true',
  });

  const response = await fetch(`${DEEPGRAM_API_URL}?${params}`, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${apiKey}`,
      'Content-Type': contentType || 'audio/webm',
    },
    body: audioBlob,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Deepgram transcription error:', errorText);
    throw new Error(`Deepgram transcription failed: ${response.status}`);
  }

  const data = await response.json();
  const transcript = data?.results?.channels?.[0]?.alternatives?.[0]?.transcript;
  return transcript || '';
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File | null;
    const provider = (formData.get('provider') as STTProvider) || 'openai';

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    const audioBlob = new Blob([await audioFile.arrayBuffer()], { type: audioFile.type });
    const contentType = audioFile.type || 'audio/webm';
    const filename = audioFile.name || 'recording.webm';

    console.log(`Transcribing with provider: ${provider}, type: ${contentType}, size: ${audioBlob.size}`);

    let text: string;

    switch (provider) {
      case 'assemblyai':
        text = await transcribeWithAssemblyAI(audioBlob);
        break;
      case 'deepgram':
        text = await transcribeWithDeepgram(audioBlob, contentType);
        break;
      case 'openai':
      default:
        text = await transcribeWithOpenAI(audioBlob, filename);
        break;
    }

    return NextResponse.json({ text, provider });
  } catch (error) {
    console.error('Transcription error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Transcription failed: ${message}` },
      { status: 500 }
    );
  }
}
