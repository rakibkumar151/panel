// Admin GET config — requires session cookie
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  // Validate session cookie
  const { rl_session } = req.cookies;
  if (!rl_session || rl_session !== process.env.SESSION_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const raw = await kv.get('rageLockConfig');
    const config = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : {
      enabled: false,
      read_off: '',
      write_off: '',
      pattern: '',
      toggle_key: '118',
    };
    res.json(config);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch config' });
  }
}
