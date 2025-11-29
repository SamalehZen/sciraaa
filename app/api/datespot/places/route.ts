import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST(req: Request) {
    const session = await auth.api.getSession();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { location, placeType = 'restaurant', radius = 5000 } = await req.json();
    
    if (!location || !location.lat || !location.lng) {
         return NextResponse.json({ error: 'Invalid location' }, { status: 400 });
    }

    const { lat, lng } = location;

    // Serper API Key should be in env
    const apiKey = process.env.SERPER_API_KEY;
    if (!apiKey) {
        console.error('SERPER_API_KEY missing');
        return NextResponse.json({ error: 'Service configuration error' }, { status: 500 });
    }

    try {
        const response = await fetch('https://google.serper.dev/places', {
            method: 'POST',
            headers: {
                'X-API-KEY': apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                q: `${placeType === 'all' ? 'restaurants, bars, cafes' : placeType}`,
                gl: 'fr', 
                location: `${lat},${lng}`,
                // Serper uses 'auto' for radius usually or implicit in search, 
                // but we can try to influence context.
            }),
        });

        if (!response.ok) {
            const text = await response.text();
            console.error('Serper API error:', text);
            return NextResponse.json({ error: 'Search failed' }, { status: 500 });
        }

        const data = await response.json();
        return NextResponse.json({ places: data.places || [] });
    } catch (error) {
        console.error('Place search exception:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
