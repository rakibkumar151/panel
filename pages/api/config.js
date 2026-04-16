// DLL এই endpoint poll করে
// GET /api/config?key=DLL_API_KEY
// Response: { enabled, read_off, write_off, pattern }
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  // DLL API key verify
  const { key } = req.query;
  if (!key || key !== process.env.DLL_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const raw = await kv.get('rageLockConfig');
    const config = raw ? JSON.parse(raw) : {
      enabled: false,
      read_off: '0',
      write_off: '0',
      pattern: '',
    };

    res.setHeader('Cache-Control', 'no-store, no-cache');
    res.json({
      enabled:  config.enabled  ?? false,
      read_off: config.read_off  || '0',
      write_off: config.write_off || '0',
      pattern:  config.pattern   || '',
    });
  } catch (e) {
    res.status(500).json({ error: 'KV error' });
  }
}
