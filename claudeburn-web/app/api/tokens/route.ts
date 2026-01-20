import { NextResponse } from 'next/server';
import { getTokens, getStats } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const tokens = await getTokens();
        const stats = await getStats();

        return NextResponse.json({
            success: true,
            tokens,
            stats,
        });
    } catch (error: any) {
        return NextResponse.json(
            {
                success: false,
                error: error.message,
            },
            { status: 500 }
        );
    }
}
