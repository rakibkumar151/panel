// Admin update endpoint — PUT { enabled, read_off, write_off, pattern }
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'PUT') return res.status(405).end();

  // Validate session cookie
  const { rl_session } = req.cookies;
  if (!rl_session || rl_session !== process.env.SESSION_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { enabled, read_off, write_off, pattern } = req.body;
    
    // Save to KV store
    await kv.set('rageLockConfig', JSON.stringify({
      enabled: !!enabled,
      read_off: read_off?.trim() || '',
      write_off: write_off?.trim() || '',
      pattern: pattern?.trim() || '',
    }));

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update config' });
  }
}
