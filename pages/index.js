import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Dashboard() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [config, setConfig] = useState({ enabled: false, toggle_key: '118', delay_ms: 0, play_sound: false });
  const [logs, setLogs] = useState([]);
  const [connectedSince, setConnectedSince] = useState(null);
  const [activeTimer, setActiveTimer] = useState('00:00:00');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Check login state and load config
  useEffect(() => {
    fetchConfig();
    const inv = setInterval(fetchLogs, 3000);
    return () => clearInterval(inv);
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);

        // Find connection status
        let startTs = null;
        for (let l of data) {
          if (l.msg.includes('Emulator Closed')) {
            startTs = null;
            break;
          }
          if (l.msg.includes('Emulator Started')) {
            startTs = l.timestamp || null;
            break;
          }
        }
        setConnectedSince(startTs);
      }
    } catch(e) {}
  };

  useEffect(() => {
    if (!connectedSince) {
      setActiveTimer('00:00:00');
      return;
    }
    const timerInv = setInterval(() => {
      const diff = Math.floor((Date.now() - connectedSince) / 1000);
      const h = String(Math.floor(diff / 3600)).padStart(2, '0');
      const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
      const s = String(diff % 60).padStart(2, '0');
      setActiveTimer(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(timerInv);
  }, [connectedSince]);

  const fetchConfig = async () => {
    try {
      // In a real app we'd have a separate /api/status to check auth, 
      // but for simplicity we'll just try to fetch the config with a mock key, 
      // wait we can't do that safely from public FE unless we have a protected route.
      // Let's create an admin-get config endpoint or just pass auth check.
      const res = await fetch('/api/admin-config');
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
        setLoggedIn(true);
      } else if (res.status === 401) {
        setLoggedIn(false);
      } else {
        const err = await res.json();
        alert('❌ Error: ' + err.error);
        setLoggedIn(false);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    if (res.ok) {
      setLoggedIn(true);
      fetchConfig();
    } else {
      alert('Wrong password');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/logout');
    setLoggedIn(false);
  };

  const saveConfig = async (newConfig) => {
    setSaving(true);
    const res = await fetch('/api/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newConfig || config)
    });
    setSaving(false);
    if (res.ok) {
      setLastUpdated(new Date().toLocaleTimeString());
      if (newConfig) setConfig(newConfig);
    } else {
      alert('Failed to save configuration');
    }
  };

  const toggleStatus = () => {
    const newConfig = { ...config, enabled: !config.enabled };
    setConfig(newConfig);
    saveConfig(newConfig);
  };

  if (loading) return <div style={styles.container}><p style={styles.text}>Loading...</p></div>;

  if (!loggedIn) {
    return (
      <div style={styles.container}>
        <Head><title>RageLock Admin</title></Head>
        <div style={styles.card}>
          <h1 style={styles.header}>RAGE LOCK <span style={styles.accent}>ADMIN</span></h1>
          <form onSubmit={handleLogin} style={styles.form}>
            <input 
              type="password" 
              placeholder="Admin Password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={styles.input}
            />
            <button type="submit" style={styles.button}>Login</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Head><title>RageLock Admin</title></Head>
      <div style={styles.main}>
        <div style={styles.headerRow}>
          <h1 style={styles.title}>RAGE LOCK <span style={styles.version}>v7</span></h1>
          <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>

        {/* Realtime Emulator Connection Banner */}
        <div style={{
          ...styles.card, 
          padding: '1rem', 
          backgroundColor: connectedSince ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: `1px solid ${connectedSince ? '#10b981' : '#ef4444'}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <h3 style={{...styles.cardTitle, margin: 0, color: connectedSince ? '#10b981' : '#ef4444'}}>
              {connectedSince ? '🟢 EMULATOR CONNECTED' : '🔴 EMULATOR DISCONNECTED'}
            </h3>
            <p style={{...styles.subText, margin: '4px 0 0 0'}}>
              {connectedSince ? 'Hack is securely attached to the game.' : 'Waiting for game to run...'}
            </p>
          </div>
          {connectedSince && (
            <div style={{textAlign: 'right'}}>
              <p style={{...styles.subText, margin: 0, fontSize: '0.75rem'}}>UPTIME</p>
              <h2 style={{margin: 0, color: '#f8fafc', letterSpacing: '2px', fontFamily: 'monospace'}}>{activeTimer}</h2>
            </div>
          )}
        </div>

        {/* Global Control Card */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Global Hack Status</h3>
          <p style={styles.subText}>Toggle this to instantly enable or disable the hack in all clients.</p>
          
          <div style={styles.toggleContainer} onClick={toggleStatus}>
            <div style={{...styles.toggleBg, backgroundColor: config.enabled ? '#10b981' : '#374151'}}>
              <div style={{
                ...styles.toggleHandle, 
                transform: config.enabled ? 'translateX(32px)' : 'translateX(0)',
                boxShadow: config.enabled ? '0 0 10px #10b981' : 'none'
              }} />
            </div>
            <span style={{...styles.statusText, color: config.enabled ? '#10b981' : '#9ca3af'}}>
              {config.enabled ? 'ACTIVE (Will run)' : 'DISABLED (Force stopped)'}
            </span>
          </div>
        </div>

        {/* Live Logs Card */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Live Status Logs</h3>
          <p style={styles.subText}>Real-time logs from the emulator.</p>
          <div style={styles.logBox}>
            {logs.length === 0 ? <p style={{color: '#64748b', fontStyle: 'italic'}}>Waiting for emulator logs...</p> : null}
            {logs.map((log, i) => (
              <div key={i} style={styles.logRow}>
                <span style={styles.logTime}>[{log.time}]</span>
                <span style={{color: log.msg.includes('Active')||log.msg.includes('ON') ? '#10b981' : (log.msg.includes('OFF')||log.msg.includes('Disabled') ? '#ef4444' : '#60a5fa') }}>
                  {log.msg}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Config Card */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Activation Settings</h3>
          <div style={styles.field}>
            <label style={styles.label}>TOGGLE KEY</label>
            <select 
              value={config.toggle_key} 
              onChange={e => setConfig({...config, toggle_key: e.target.value})} 
              style={styles.input}
            >
              <option value="0">None (Website Only)</option>
              <option value="112">F1</option>
              <option value="113">F2</option>
              <option value="114">F3</option>
              <option value="115">F4</option>
              <option value="116">F5</option>
              <option value="117">F6</option>
              <option value="118">F7 (Default)</option>
              <option value="119">F8</option>
              <option value="120">F9</option>
              <option value="121">F10</option>
              <option value="122">F11</option>
              <option value="123">F12</option>
              <option value="45">Insert</option>
              <option value="46">Delete</option>
              <option value="36">Home</option>
              <option value="35">End</option>
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>AUTO-START DELAY (SECONDS)</label>
            <input 
              type="number"
              value={config.delay_ms / 1000} 
              onChange={e => setConfig({...config, delay_ms: Math.max(0, parseInt(e.target.value) * 1000)})} 
              style={styles.input}
              min="0"
            />
          </div>

          <div style={styles.field}>
            <label style={{...styles.label, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'}}>
              <input 
                type="checkbox" 
                checked={config.play_sound} 
                onChange={e => setConfig({...config, play_sound: e.target.checked})} 
                style={{ width: '18px', height: '18px' }}
              />
              ENABLE IN-GAME BEEPS (SOUND)
            </label>
            <p style={{...styles.subText, margin: 0, fontSize: '0.8rem'}}>If disabled, the hack will turn on/off silently without Beeps.</p>
          </div>

          <div style={styles.actionBar}>
            <button 
              onClick={() => saveConfig(config)} 
              disabled={saving}
              style={{...styles.saveBtn, opacity: saving ? 0.7 : 1}}
            >
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
            {lastUpdated && <span style={styles.savedNotice}>Last saved: {lastUpdated}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#0f172a',
    color: '#e2e8f0',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '2rem'
  },
  text: { color: '#e2e8f0' },
  card: {
    backgroundColor: '#1e293b',
    padding: '2rem',
    borderRadius: '16px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
    width: '100%',
    maxWidth: '500px',
    marginBottom: '1.5rem',
    border: '1px solid #334155'
  },
  header: { textAlign: 'center', marginBottom: '2rem', fontSize: '2rem', letterSpacing: '2px' },
  title: { margin: 0, fontSize: '1.5rem', letterSpacing: '1px' },
  accent: { color: '#3b82f6' },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  input: {
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    border: '1px solid #475569',
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    fontSize: '1rem',
    outline: 'none',
    transition: 'border-color 0.2s',
    fontFamily: 'monospace'
  },
  button: {
    padding: '0.75rem',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#3b82f6',
    color: 'white',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  saveBtn: {
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#10b981',
    color: 'white',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  headerRow: {
    width: '100%',
    maxWidth: '500px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem'
  },
  topbar: {
    width: '100%',
    maxWidth: '500px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem'
  },
  logoutBtn: {
    background: 'none',
    border: '1px solid #ef4444',
    color: '#ef4444',
    padding: '0.4rem 1rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  main: { width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  cardTitle: { margin: '0 0 0.5rem 0', fontSize: '1.25rem', color: '#f8fafc' },
  subText: { margin: '0 0 1.5rem 0', fontSize: '0.9rem', color: '#94a3b8' },
  toggleContainer: { display: 'flex', alignItems: 'center', gap: '1.5rem', cursor: 'pointer', padding: '1rem 0' },
  toggleBg: {
    width: '64px',
    height: '32px',
    borderRadius: '999px',
    position: 'relative',
    transition: 'background-color 0.3s ease',
  },
  toggleHandle: {
    position: 'absolute',
    top: '4px',
    left: '4px',
    width: '24px',
    height: '24px',
    backgroundColor: 'white',
    borderRadius: '50%',
    transition: 'transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1), box-shadow 0.3s ease',
  },
  statusText: { fontWeight: 'bold', fontSize: '1.1rem', transition: 'color 0.3s ease' },
  field: { display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.2rem' },
  label: { fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 'bold', letterSpacing: '0.5px' },
  actionBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' },
  savedNotice: { color: '#10b981', fontSize: '0.85rem', fontStyle: 'italic' },
  logBox: {
    backgroundColor: '#0f172a',
    borderRadius: '8px',
    padding: '1rem',
    height: '200px',
    overflowY: 'auto',
    border: '1px solid #334155',
    fontFamily: 'monospace',
    fontSize: '0.85rem',
  },
  logRow: { marginBottom: '0.3rem' },
  logTime: { color: '#94a3b8', marginRight: '0.5rem' }
};
