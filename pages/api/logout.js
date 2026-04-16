// Logout — clears session cookie
export default function handler(req, res) {
  res.setHeader('Set-Cookie',
    'rl_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict'
  );
  res.json({ success: true });
}
