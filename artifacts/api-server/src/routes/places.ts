import { Router, Request, Response } from 'express';

const router = Router();

// ─── Segment → Google Places keyword mapping ──────────────────────────────────
const SEGMENT_KEYWORDS: Record<string, string> = {
  "Clínicas & Saúde":           "clínicas médicas consultórios",
  "Imobiliário":                "imobiliárias",
  "Advocacia":                  "escritórios de advocacia advogados",
  "Serviços & Construção":      "construtoras empresas de construção",
  "Varejo & E-commerce":        "lojas varejo comércio",
  "Consultoria & B2B":          "consultoria empresas tecnologia",
  "Consultoria & B2B/SaaS":     "consultoria empresas tecnologia",
  "Seguros & Financeiro":       "corretoras de seguro",
  "Seguros":                    "corretoras de seguro",
  "Educação":                   "escolas faculdades cursos",
  "Crédito & Consórcio":        "financeiras bancos crédito",
  "Financeiro & Crédito":       "financeiras bancos crédito",
  "Alimentação & Food Service": "restaurantes lanchonetes pizzarias",
  "Serviços de Beleza":         "salões de beleza barbearias estéticas",
  "Beleza":                     "salões de beleza barbearias estéticas",
  "Oficinas & Manutenção":      "oficinas mecânicas manutenção",
  "Marketing & Publicidade":    "agências de marketing publicidade",
  "Moda":                       "lojas de roupa moda boutiques",
  "Outros":                     "empresa comércio",
};

// ─── POST /places/radar ─── Google Places Nearby Search + Details ─────────────
router.post('/radar', async (req: Request, res: Response) => {
  try {
    const { segmento, cidade, estado, raio = 5000, lat: bodyLat, lng: bodyLng } = req.body as {
      segmento?: string;
      cidade?: string;
      estado?: string;
      raio?: number;
      lat?: number;
      lng?: number;
    };

    const apiKey = process.env.GOOGLE_MAPS_PLATFORM_KEY ?? process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ error: 'Google Maps API key não configurada.' });
    }

    const keyword = SEGMENT_KEYWORDS[segmento ?? ''] ?? 'empresa';

    let rawPlaces: any[];

    if (typeof bodyLat === 'number' && typeof bodyLng === 'number') {
      // Path A — GPS coords provided: use Nearby Search directly (no geocoding needed)
      const nearbyUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${bodyLat},${bodyLng}&radius=${raio}&keyword=${encodeURIComponent(keyword)}&language=pt-BR&key=${apiKey}`;
      const nearbyResp = await fetch(nearbyUrl);
      const nearbyData = (await nearbyResp.json()) as { status: string; results: any[]; error_message?: string };
      if (nearbyData.status !== 'OK' && nearbyData.status !== 'ZERO_RESULTS') {
        return res.status(502).json({ error: nearbyData.error_message ?? nearbyData.status });
      }
      rawPlaces = (nearbyData.results ?? []).slice(0, 15);
    } else {
      // Path B — City name: use Text Search (Geocoding API not required)
      // Build query like: "clínica médica dentista em Criciúma, SC, Brasil"
      const locationParts = [cidade, estado, 'Brasil'].filter(Boolean).join(', ');
      const textQuery = locationParts ? `${keyword} em ${locationParts}` : keyword;
      const textUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(textQuery)}&language=pt-BR&key=${apiKey}`;
      const textResp = await fetch(textUrl);
      const textData = (await textResp.json()) as { status: string; results: any[]; error_message?: string };
      if (textData.status !== 'OK' && textData.status !== 'ZERO_RESULTS') {
        return res.status(502).json({ error: textData.error_message ?? textData.status });
      }
      rawPlaces = (textData.results ?? []).slice(0, 15);
    }

    const places = rawPlaces;

    // Step 3: Enrich each place with phone number via Place Details
    const enriched = await Promise.all(
      places.map(async (p: any) => {
        let phone = '';
        try {
          const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${p.place_id}&fields=formatted_phone_number&language=pt-BR&key=${apiKey}`;
          const detailsResp = await fetch(detailsUrl);
          const detailsData = (await detailsResp.json()) as { result?: { formatted_phone_number?: string } };
          phone = detailsData.result?.formatted_phone_number ?? '';
        } catch { /* best-effort */ }

        return {
          placeId: p.place_id as string,
          name: p.name as string,
          address: (p.vicinity ?? p.formatted_address ?? '') as string,
          rating: (p.rating ?? null) as number | null,
          totalRatings: (p.user_ratings_total ?? 0) as number,
          status: (p.business_status ?? 'OPERATIONAL') as string,
          phone,
          hasPhone: !!phone,
        };
      })
    );

    req.log.info({ segmento, cidade, raio, count: enriched.length }, 'radar search completed');
    return res.json({ results: enriched, total: enriched.length });

  } catch (error) {
    req.log.error({ error }, 'radar search error');
    return res.status(500).json({ error: 'Internal server error' });
  }
});

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
