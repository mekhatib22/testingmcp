import { useState, useEffect, useCallback } from 'react';
import { api } from './api.js';

const AGENTS = [
  { id: 'copilot', name: 'GitHub Copilot' },
  { id: 'codex', name: 'OpenAI Codex' },
  { id: 'claude', name: 'Anthropic Claude' },
  { id: 'gemini', name: 'Google Gemini' },
];

export default function App() {
  const [tab, setTab] = useState('run');
  const [machines, setMachines] = useState([]);
  const [agentInfo, setAgentInfo] = useState([]);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState(AGENTS[0].id);
  const [prompt, setPrompt] = useState('');
  const [flags, setFlags] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [backendUrl, setBackendUrl] = useState(
    localStorage.getItem('backendUrl') || ''
  );
  const [authToken, setAuthToken] = useState(
    localStorage.getItem('authToken') || ''
  );
  const [newMachine, setNewMachine] = useState({ name: '', daemonUrl: '' });
  const [registerError, setRegisterError] = useState('');

  const loadMachines = useCallback(async () => {
    try {
      const data = await api.machines.list();
      setMachines(data.machines || []);
    } catch {
      setMachines([]);
    }
  }, []);

  useEffect(() => {
    loadMachines();
  }, [loadMachines]);

  useEffect(() => {
    if (!selectedMachine) return;
    // Fetch agent availability from daemon via /api/context is not needed here;
    // we use the static AGENTS list and mark availability based on backend response.
    setAgentInfo(AGENTS);
  }, [selectedMachine]);

  const handleRun = async () => {
    if (!selectedMachine || !prompt.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const flagList = flags.trim()
        ? flags.trim().split(/\s+/)
        : [];
      const data = await api.execute({
        machineId: selectedMachine.id,
        agent: selectedAgent,
        prompt: prompt.trim(),
        flags: flagList,
      });
      setResult(data);
      setHistory((h) => [
        { id: Date.now(), agent: selectedAgent, machine: selectedMachine.name, prompt, data, ts: new Date().toLocaleTimeString() },
        ...h.slice(0, 49),
      ]);
    } catch (err) {
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setRegisterError('');
    if (!newMachine.daemonUrl) { setRegisterError('Daemon URL is required'); return; }
    try {
      await api.machines.register(newMachine);
      setNewMachine({ name: '', daemonUrl: '' });
      await loadMachines();
    } catch (err) {
      setRegisterError(err.message);
    }
  };

  const handleRemoveMachine = async (id) => {
    try {
      await api.machines.remove(id);
      if (selectedMachine?.id === id) setSelectedMachine(null);
      await loadMachines();
    } catch { /* ignore */ }
  };

  const saveSettings = () => {
    localStorage.setItem('backendUrl', backendUrl);
    localStorage.setItem('authToken', authToken);
    setSettingsOpen(false);
    window.location.reload();
  };

  const resultOutput = result
    ? result.error
      ? result.error
      : result.result
        ? (result.result.stdout || '') + (result.result.stderr ? `\n[stderr]\n${result.result.stderr}` : '')
        : JSON.stringify(result, null, 2)
    : '';

  const resultSuccess = result && !result.error && result.result?.success;
  const resultFailed = result && (result.error || result.result?.success === false);

  return (
    <div className="app">
      <header>
        <span role="img" aria-label="robot" style={{ fontSize: '1.6rem' }}>🤖</span>
        <div>
          <h1>Multi-AI CLI Framework</h1>
          <span>Interact with AI CLIs from anywhere</span>
        </div>
        <button
          className="btn-secondary btn-sm"
          style={{ marginLeft: 'auto' }}
          onClick={() => setSettingsOpen(true)}
        >
          ⚙ Settings
        </button>
      </header>

      <div className="tabs">
        {[['run', '▶ Run'], ['machines', '🖥 Machines'], ['history', '📜 History']].map(([id, label]) => (
          <button key={id} className={`tab-btn${tab === id ? ' active' : ''}`} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'run' && (
        <>
          {/* Machine selector */}
          <div className="card">
            <h2>Target Machine</h2>
            {machines.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '.88rem' }}>
                No machines registered yet. Go to the <button className="btn-secondary btn-sm" onClick={() => setTab('machines')}>Machines</button> tab to add one.
              </p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
                {machines.map((m) => (
                  <div
                    key={m.id}
                    className={`machine-chip${selectedMachine?.id === m.id ? ' selected' : ''}`}
                    onClick={() => setSelectedMachine(m)}
                  >
                    <span>🖥</span>
                    <span className="name">{m.name}</span>
                    <span className="url">{m.daemonUrl}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Agent selector */}
          <div className="card">
            <h2>AI Agent</h2>
            <div className="agent-grid">
              {AGENTS.map((a) => (
                <button
                  key={a.id}
                  className={`agent-chip${selectedAgent === a.id ? ' selected' : ''}`}
                  onClick={() => setSelectedAgent(a.id)}
                >
                  <span className="dot" />
                  {a.name}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt input */}
          <div className="card">
            <h2>Prompt</h2>
            <div className="form-row">
              <label>Your prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Write a bash script to list large files"
                rows={4}
              />
            </div>
            <div className="form-row">
              <label>Extra flags (space-separated, optional)</label>
              <input
                value={flags}
                onChange={(e) => setFlags(e.target.value)}
                placeholder="e.g. -v --shell"
              />
            </div>
            <button
              className="btn-primary"
              disabled={loading || !selectedMachine || !prompt.trim()}
              onClick={handleRun}
              style={{ width: '100%' }}
            >
              {loading && <span className="spinner" />}
              {loading ? 'Running…' : 'Run Prompt'}
            </button>
          </div>

          {/* Output */}
          {result && (
            <div className="card">
              <h2>
                Result&nbsp;
                {resultSuccess && <span className="badge success">Success</span>}
                {resultFailed && <span className="badge error">Failed</span>}
              </h2>
              <div className={`output-block${resultSuccess ? ' success' : resultFailed ? ' error' : ''}`}>
                {resultOutput || '(no output)'}
              </div>
            </div>
          )}
        </>
      )}

      {tab === 'machines' && (
        <div className="card">
          <h2>Registered Machines</h2>

          {/* Register form */}
          <div className="form-grid" style={{ marginBottom: '1rem' }}>
            <div className="form-row">
              <label>Machine name</label>
              <input
                value={newMachine.name}
                onChange={(e) => setNewMachine((m) => ({ ...m, name: e.target.value }))}
                placeholder="e.g. John's Laptop"
              />
            </div>
            <div className="form-row">
              <label>Daemon URL *</label>
              <input
                value={newMachine.daemonUrl}
                onChange={(e) => setNewMachine((m) => ({ ...m, daemonUrl: e.target.value }))}
                placeholder="http://192.168.1.10:5001"
              />
            </div>
          </div>
          {registerError && <p style={{ color: 'var(--error)', fontSize: '.85rem', marginBottom: '.5rem' }}>{registerError}</p>}
          <button className="btn-primary btn-sm" onClick={handleRegister}>
            + Register Machine
          </button>

          <hr style={{ borderColor: 'var(--border)', margin: '1rem 0' }} />

          {machines.length === 0
            ? <p style={{ color: 'var(--text-muted)', fontSize: '.88rem' }}>No machines registered.</p>
            : machines.map((m) => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.5rem' }}>
                <span style={{ flex: 1 }}>🖥 <strong>{m.name}</strong> <span style={{ color: 'var(--text-muted)', fontSize: '.8rem' }}>{m.daemonUrl}</span></span>
                <button className="btn-secondary btn-sm" onClick={() => handleRemoveMachine(m.id)}>Remove</button>
              </div>
            ))
          }
        </div>
      )}

      {tab === 'history' && (
        <div className="card">
          <h2>Run History</h2>
          {history.length === 0
            ? <p style={{ color: 'var(--text-muted)', fontSize: '.88rem' }}>No runs yet.</p>
            : history.map((h) => (
              <div key={h.id} className="history-item" onClick={() => { setTab('run'); setPrompt(h.prompt); setSelectedAgent(h.agent); setResult(h.data); }}>
                <div className="history-meta">{h.ts} · {h.agent} on {h.machine}</div>
                <div className="history-prompt">{h.prompt}</div>
              </div>
            ))
          }
        </div>
      )}

      {settingsOpen && (
        <div className="overlay" onClick={() => setSettingsOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Settings</h2>
            <div className="form-row">
              <label>Backend URL (leave empty to use same origin)</label>
              <input
                value={backendUrl}
                onChange={(e) => setBackendUrl(e.target.value)}
                placeholder="http://localhost:3001"
              />
            </div>
            <div className="form-row">
              <label>Auth Token (optional)</label>
              <input
                type="password"
                value={authToken}
                onChange={(e) => setAuthToken(e.target.value)}
                placeholder="Bearer token"
              />
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setSettingsOpen(false)}>Cancel</button>
              <button className="btn-primary" onClick={saveSettings}>Save & Reload</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
