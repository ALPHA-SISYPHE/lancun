const OPENAQ_BASE = 'https://api.openaq.org/v3';
const OPENAQ_DOCS = 'https://docs.openaq.org/';
const PM25_PARAM_ID = 2;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAQ_API_KEY?.trim();
  if (!apiKey) {
    return res.status(502).json({ error: 'OpenAQ API key not configured' });
  }

  const lat = Number(req.query.lat);
  const lon = Number(req.query.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return res.status(400).json({ error: 'lat and lon query parameters required' });
  }

  const radius = Number(req.query.radius) || 25000;
  const headers = { Accept: 'application/json', 'X-API-Key': apiKey };

  try {
    const locationsUrl = `${OPENAQ_BASE}/locations?coordinates=${lat},${lon}&radius=${radius}&parameters_id=${PM25_PARAM_ID}&limit=5`;
    const locationsRes = await fetch(locationsUrl, { headers });
    if (!locationsRes.ok) {
      return res.status(502).json({ error: 'OpenAQ locations request failed' });
    }

    const locationsPayload = await locationsRes.json();
    const location = locationsPayload?.results?.[0];
    if (!location?.id) {
      return res.status(502).json({ error: 'No OpenAQ location near coordinates' });
    }

    const latestRes = await fetch(`${OPENAQ_BASE}/locations/${location.id}/latest`, { headers });
    if (!latestRes.ok) {
      return res.status(502).json({ error: 'OpenAQ latest request failed' });
    }

    const latestPayload = await latestRes.json();
    const measurement = latestPayload?.results?.find((row) => row?.parameter?.name === 'pm25')
      || latestPayload?.results?.[0];
    if (!measurement || measurement.value == null) {
      return res.status(502).json({ error: 'OpenAQ PM2.5 measurement empty' });
    }

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json({
      value: Number(measurement.value),
      updatedAt: measurement.datetime?.utc || measurement.datetime?.local || '—',
      locationName: location.name || location.locality || 'OpenAQ',
      sourceUrl: OPENAQ_DOCS,
    });
  } catch {
    return res.status(502).json({ error: 'OpenAQ proxy unavailable' });
  }
}
