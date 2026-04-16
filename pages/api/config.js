// DLL এই endpoint poll করে
// GET /api/config?key=DLL_API_KEY
// Response: { enabled, read_off, write_off, pattern, toggle_key }
import redis from '../../lib/redis';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  // DLL API key verify
  const { key } = req.query;
  if (!key || key !== process.env.DLL_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const raw = await redis.get('rageLockConfig');
    const config = raw ? JSON.parse(raw) : {
      enabled: false,
      toggle_key: '118', // 118 = VK_F7 by default
      delay_ms: 0,
      play_sound: false,
    };

    res.setHeader('Cache-Control', 'no-store, no-cache');
    res.json({
      enabled:  config.enabled  ?? false,
      read_off: process.env.HACK_READ_OFF || '0',
      write_off: process.env.HACK_WRITE_OFF || '0',
      pattern: process.env.HACK_PATTERN || '',
      toggle_key: (config.toggle_key !== undefined && config.toggle_key !== null) ? String(config.toggle_key) : '118',
      delay_ms: parseInt(config.delay_ms) || 0,
      play_sound: !!config.play_sound,
    });
  } catch (e) {
    res.status(500).json({ error: 'KV error' });
  }
}
