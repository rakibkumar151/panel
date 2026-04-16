// DLL sends live status here: POST /api/log?key=xxx { message: "state", timestamp: 12345 }
import redis from '../../lib/redis';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { key } = req.query;
  if (!key || key !== process.env.DLL_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'No message' });

    const logEntry = JSON.stringify({
      time: new Date().toLocaleTimeString(),
      msg: message,
    });

    // Push to list and keep only last 30 logs
    const multi = redis.multi();
    multi.lpush('rageLockLogs', logEntry);
    multi.ltrim('rageLockLogs', 0, 29);
    await multi.exec();

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'KV error' });
  }
}
