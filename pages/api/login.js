// Admin login — POST { password }
// Sets session cookie if correct
export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { password } = req.body;
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Wrong password' });
  }

  // Simple cookie session
  res.setHeader('Set-Cookie',
    `rl_session=${process.env.SESSION_TOKEN}; HttpOnly; Path=/; Max-Age=86400; SameSite=Lax; Secure`
  );
  res.json({ success: true });
}
