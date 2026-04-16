// Admin GET config — requires session cookie
import redis from '../../lib/redis';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  // Validate session cookie
  const { rl_session } = req.cookies;
  if (!rl_session || rl_session !== process.env.SESSION_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const raw = await redis.get('rageLockConfig');
    const config = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : {
      enabled: false,
      toggle_key: '118',
      delay_ms: 0,
      play_sound: false,
    };
    res.json(config);
  } catch (e) {
    res.status(500).json({ error: 'Database (Vercel KV) connection failed! Check Vercel Storage.' });
  }
}
