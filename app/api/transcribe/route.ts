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

    const prompt = `Tu es un agent linguistique spécialisé dans la réécriture intelligente de transcriptions speech-to-text en toutes langues.

Objectif : Transformer le texte oral brut en un texte écrit naturel, clair et professionnel, tout en respectant strictement le sens, l'intention et le ton émotionnel.

Instructions :
- Corriger les fautes de grammaire, conjugaison et syntaxe
- Supprimer les répétitions inutiles (ex: "en fait", "voilà", "mais" répétés)
- Reformuler de manière fluide et naturelle
- Ne jamais ajouter d'informations ni changer le sens
- Conserver le registre émotionnel (déception, fermeté, décision, etc.)
- Ne pas moraliser, ne pas juger
- Utiliser un langage clair, professionnel et humain
- Structurer en phrases lisibles

Retourne UNIQUEMENT le texte corrigé, sans explications ni commentaires.`;

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Audio,
        },
      },
      prompt,
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
