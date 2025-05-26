// === App.jsx (logs socket.io en direct avec fix listeners multiples apps) ===
import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');

function App() {
  const [apps, setApps] = useState([]);
  const [newApp, setNewApp] = useState({ nom: '', port: '' });
  const [logs, setLogs] = useState({});
  const logRefs = useRef({});

  useEffect(() => {
    window.socket = socket;
    socket.on('connect', () => {
      console.log('🟢 Connecté au WebSocket backend');
    });
  }, []);

  useEffect(() => {
    fetch('http://localhost:3001/terraform/apps')
      .then(res => res.json())
      .then(setApps);
  }, []);

  useEffect(() => {
    apps.forEach(app => {
      const nom = app.nom;
      const eventName = `output-${nom}`;
      if (!socket.listeners(eventName).length) {
        socket.off(eventName);
        socket.on(eventName, (line) => {
          setLogs(prev => ({
            ...prev,
            [nom]: [...(prev[nom] || []), line]
          }));
        });
      }
    });
  }, [apps]);

  const handleCreate = async () => {
    const response = await fetch('http://localhost:3001/terraform/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newApp)
    });
    if (response.ok) {
      setApps(prev => [...prev, { ...newApp }]);
      setLogs(prev => ({ ...prev, [newApp.nom]: [] }));
      setNewApp({ nom: '', port: '' });
    } else {
      const msg = await response.text();
      alert(`Erreur: ${msg}`);
    }
  };

  const handleDelete = async (nom) => {
    const response = await fetch('http://localhost:3001/terraform/destroy', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom })
    });
    if (response.ok) {
      setApps(prev => prev.filter(app => app.nom !== nom));
    } else {
      const msg = await response.text();
      alert(`Erreur suppression: ${msg}`);
    }
  };

  useEffect(() => {
    Object.keys(logRefs.current).forEach(nom => {
      const ref = logRefs.current[nom];
      if (ref) ref.scrollTop = ref.scrollHeight;
    });
  }, [logs]);

  return (
    <div style={{ display: 'flex', padding: '20px', gap: '30px' }}>
      {/* Colonne gauche : Apps */}
      <div style={{ flex: 1, marginLeft: 150 }}>
        <h2>Applications déployées</h2>
        <input
          type="text"
          placeholder="Nom"
          value={newApp.nom}
          onChange={(e) => setNewApp({ ...newApp, nom: e.target.value })}
          style={{ marginRight: 500 }}
        />
        <input
          type="number"
          placeholder="Port"
          value={newApp.port}
          onChange={(e) => setNewApp({ ...newApp, port: parseInt(e.target.value) })}
        />
        <button onClick={handleCreate} style={{ marginLeft: 10, marginTop: 10 }}>Créer</button>

        <ul style={{ marginTop: 20 }}>
          {apps.map((app) => (
            <li key={app.nom} style={{ marginBottom: 10 }}>
              <strong>{app.nom}</strong> (port {app.port})
              <button
                style={{ marginLeft: 10 }}
                onClick={() => handleDelete(app.nom)}
              >❌ Supprimer</button>
            </li>
          ))}
        </ul>
      </div>

      {/* Colonne droite : Logs */}
      <div style={{ flex: 2 }}>
        <h2>Logs en direct</h2>
        {Object.entries(logs).map(([nom, lignes]) => (
          <div key={nom} style={{ marginBottom: 30 }}>
            <h4>{nom}</h4>
            <div
              ref={(el) => (logRefs.current[nom] = el)}
              style={{
                height: '400px',
                width: '900px',
                overflowY: 'auto',
                backgroundColor: '#111',
                color: '#0f0',
                padding: '10px',
                fontFamily: 'monospace',
                borderRadius: '6px'
              }}
            >
              {lignes.map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
