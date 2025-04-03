import { getOpenAIResponse } from '@/app/lib/openapi';
import { NextResponse } from 'next/server';

export async function GET() {
    const flashcards = JSON.parse(await getOpenAIResponse(
        'Generate a list of 5 flashcards for latin english vocabulary with the following format: {"front": latin, "back": english}. The list should be in JSON format and should not include any other text. Do not include ```. The flashcards should be suitable for a beginner level. The list should be in the following format: [{"front": "latin word", "back": "english word"}, ...].'
    ));
    return NextResponse.json(flashcards);
}


export async function POST(req: Request) {
    const body = await req.json();
    const { knownWords } = body;

    const flashcards = JSON.parse(await getOpenAIResponse(
        `Generate a list of 5 flashcards for latin english vocabulary with the following format: {"front": latin, "back": english}. The list should be in JSON format and should not include any other text. Do not include \`\`\`. The flashcards should be suitable for a beginner level. The list should be in the following format: [{"front": "latin word", "back": "english word"}, ...]. Do not reuse the following words: ${knownWords.join(', ')}.`
    ));
    return NextResponse.json(flashcards);
}
