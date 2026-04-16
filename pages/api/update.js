// Admin update endpoint — PUT { enabled, read_off, write_off, pattern }
import redis from '../../lib/redis';

export default async function handler(req, res) {
  if (req.method !== 'PUT') return res.status(405).end();

  // Validate session cookie
  const { rl_session } = req.cookies;
  if (!rl_session || rl_session !== process.env.SESSION_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { enabled, toggle_key, delay_ms, play_sound } = req.body;
    
    // Save to KV store
    await redis.set('rageLockConfig', JSON.stringify({
      enabled: !!enabled,
      toggle_key: toggle_key || '118',
      delay_ms: parseInt(delay_ms) || 0,
      play_sound: !!play_sound,
    }));

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update config' });
  }
}
