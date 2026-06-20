import { Router, Request, Response } from 'express';

const router = Router();

interface PlaceResult {
  name: string;
  formatted_address: string;
  rating?: number;
  user_ratings_total?: number;
  place_id: string;
  business_status?: string;
  types?: string[];
}

router.post('/search', async (req: Request, res: Response) => {
  try {
    const { bairro, cidade, tipo } = req.body as {
      bairro?: string;
      cidade?: string;
      tipo?: string;
    };

    if (!tipo) {
      return res.status(400).json({ error: 'tipo is required' });
    }

    const apiKey = process.env.GOOGLE_MAPS_PLATFORM_KEY ?? process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ error: 'Google Maps API key not configured' });
    }

    const queryParts = [tipo, bairro, cidade].filter(Boolean).join(' ');
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(queryParts)}&language=pt-BR&key=${apiKey}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Google API error: ${response.status}`);
    }

    const data = (await response.json()) as {
      results: PlaceResult[];
      status: string;
      error_message?: string;
    };

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      return res.status(502).json({ error: data.error_message ?? data.status });
    }

    const results = (data.results ?? []).slice(0, 20).map((p) => ({
      placeId: p.place_id,
      name: p.name,
      address: p.formatted_address,
      rating: p.rating ?? null,
      totalRatings: p.user_ratings_total ?? 0,
      status: p.business_status ?? 'OPERATIONAL',
      types: p.types ?? [],
    }));

    return res.json({ results });
  } catch (error) {
    req.log.error({ error }, 'places search error');
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
