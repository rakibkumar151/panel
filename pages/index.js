import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Dashboard() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [config, setConfig] = useState({ enabled: false, read_off: '', write_off: '', pattern: '' });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Check login state and load config
  useEffect(() => {
    fetchConfig();
  }, []);

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
      } else {
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
      <div style={styles.topbar}>
        <h2 style={styles.title}>RAGE LOCK <span style={styles.accent}>v5</span></h2>
        <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
      </div>

      <div style={styles.main}>
        {/* Toggle Card */}
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
              {config.enabled ? 'ACTIVE (F7 Allowed)' : 'DISABLED (F7 Blocked)'}
            </span>
          </div>
        </div>

        {/* Config Card */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Memory Configuration</h3>
          <p style={styles.subText}>Update memory offsets and scan pattern.</p>

          <div style={styles.field}>
            <label style={styles.label}>READ_OFF</label>
            <input 
              value={config.read_off} 
              onChange={e => setConfig({...config, read_off: e.target.value})} 
              style={styles.input} 
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>WRITE_OFF</label>
            <input 
              value={config.write_off} 
              onChange={e => setConfig({...config, write_off: e.target.value})} 
              style={styles.input} 
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>PATTERN</label>
            <input 
              value={config.pattern} 
              onChange={e => setConfig({...config, pattern: e.target.value})} 
              style={styles.input} 
              placeholder="e.g. 55 8B EC 83 EC"
            />
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
  savedNotice: { color: '#10b981', fontSize: '0.85rem', fontStyle: 'italic' }
};
