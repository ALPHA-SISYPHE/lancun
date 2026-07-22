const UPSTREAM = 'https://api.coral.tsr.lol/stations/southeast_florida/current';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const upstream = await fetch(UPSTREAM, {
      headers: { Accept: 'application/json' },
    });

    if (!upstream.ok) {
      return res.status(502).json({ error: 'Upstream Coral Watch request failed' });
    }

    const data = await upstream.json();
    res.setHeader('Cache-Control', 's-maxage=43200, stale-while-revalidate=86400');
    return res.status(200).json(data);
  } catch {
    return res.status(502).json({ error: 'Coral Watch proxy unavailable' });
  }
}
