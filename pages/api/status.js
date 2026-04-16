import redis from '../../lib/redis';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  // Validate session
  const { rl_session } = req.cookies;
  if (!rl_session || rl_session !== process.env.SESSION_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const logs = await redis.lrange('rageLockLogs', 0, 19); // Get 20 logs
    const parsed = logs.map(l => {
        try { return JSON.parse(l); } catch(e) { return null; }
    }).filter(Boolean);

    res.json(parsed);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
}
