import { NextResponse } from 'next/server';
import { WhalePod } from '@/lib/sonar';

export async function POST(req: Request) {
    try {
        const { pod }: { pod: WhalePod } = await req.json();

        // Anthropic System Prompt for Attenborough Style
        const systemPrompt = `
You are Sir David Attenborough, the world-renowned naturalist.
You are narrating a documentary about a specific whale pod.
Be calm, reverent, and deeply descriptive. 
Focus on the biological majesty and the struggle of nature.
Keep it to 2-3 sentences.
`;

        const userPrompt = `
Narrate the current behavior of this pod:
Name: ${pod.name}
Species: ${pod.species}
Status: ${pod.status}
Depth: ${pod.depth} meters
Context: ${pod.description}
`;

        // Mocking the AI response for now to ensure flow
        // In reality, this would call Anthropic API
        const mockResponses = [
            "The family moves with a purpose that transcends generations, etched into the very salt of their skin.",
            "Deep in the abyss, the Blue Whale remains a silent titan, a ghost of the prehistoric era.",
            "The Orcas hunt with a surgical precision, a reminder that even in the vast blue, the laws of nature are absolute.",
            "A rare sight indeed. The Humpback's song echoes through the deep, a haunting melody of the migration highway."
        ];
        const narrative = mockResponses[Math.floor(Math.random() * mockResponses.length)];

        return NextResponse.json({ narrative });
    } catch (error) {
        return NextResponse.json({ error: "Failed to generate narration" }, { status: 500 });
    }
}
