import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');

function App() {
  const [apps, setApps] = useState([]);
  const [newApp, setNewApp] = useState({ nom: '', port: '' });
  const [logs, setLogs] = useState({});
  const logRefs = useRef({});

  // Connexion socket + restauration logs/apps
  useEffect(() => {
    window.socket = socket;

    socket.on('connect', () => {
      console.log('🟢 Connecté au WebSocket localhost');
    });

    const savedLogs = localStorage.getItem('logs');
    if (savedLogs) {
      const parsed = JSON.parse(savedLogs);
      setLogs(parsed);

      // Recréer les apps avec leur port
      const reconstructed = Object.entries(parsed).map(([nom, data]) => ({
        nom,
        port: data.port || 0
      }));
      setApps(reconstructed);
    }
  }, []);

  // Récupérer les apps actives du backend
  useEffect(() => {
    fetch('http://localhost:3001/terraform/apps')
      .then(res => res.json())
      .then(serverApps => {
        setApps(prev => {
          const merged = [...prev];
          serverApps.forEach(app => {
            if (!merged.find(a => a.nom === app.nom)) merged.push(app);
          });
          return merged;
        });
      });
  }, []);

  // Attacher les listeners socket
  useEffect(() => {
    apps.forEach(app => {
      const nom = app.nom;
      const outputEvent = `output-${nom}`;
      const destroyEvent = `destroy-complete-${nom}`;

      if (!socket.listeners(outputEvent).length) {
        socket.off(outputEvent);
        socket.on(outputEvent, (line) => {
          setLogs(prev => ({
            ...prev,
            [nom]: {
              ...prev[nom],
              lines: [...(prev[nom]?.lines || []), line]
            }
          }));
        });
      }

      // 🔥 Écouter la fin de suppression pour effacer les logs
      if (!socket.listeners(destroyEvent).length) {
        socket.off(destroyEvent);
        socket.on(destroyEvent, () => {
          setLogs(prev => {
            const updated = { ...prev };
            delete updated[nom];
            localStorage.setItem('logs', JSON.stringify(updated));
            return updated;
          });
        });
      }
    });
  }, [apps]);

  // Sauvegarder les logs dans localStorage
  useEffect(() => {
    if (Object.keys(logs).length > 0) {
      localStorage.setItem('logs', JSON.stringify(logs));
    }
  }, [logs]);

  const handleCreate = async () => {
    const response = await fetch('http://localhost:3001/terraform/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newApp)
    });

    if (response.ok) {
      setApps(prev => [...prev, { ...newApp }]);
      setLogs(prev => ({
        ...prev,
        [newApp.nom]: {
          port: newApp.port,
          lines: []
        }
      }));
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
      // (on ne supprime pas les logs ici, ils seront effacés par le socket destroy-complete-[nom])
    } else {
      const msg = await response.text();
      alert(`Erreur suppression: ${msg}`);
    }
  };

  // Scroll auto
  useEffect(() => {
    Object.keys(logRefs.current).forEach(nom => {
      const ref = logRefs.current[nom];
      if (ref) ref.scrollTop = ref.scrollHeight;
    });
  }, [logs]);

return (
    <div style={{ display: 'flex', padding: '20px', gap: '30px' }}>
      {/* Colonne gauche */}
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
          style={{ marginBottom: 10 }}
        />
        <button onClick={handleCreate}>Créer</button>

        <ul style={{ marginTop: 20 }}>
          {apps.map((app, index) => (
            <li key={`${app.nom}-${index}`} style={{ marginBottom: 10 }}>
              <strong>{app.nom}</strong> (port {app.port})
              <button
                style={{ marginLeft: 10 }}
                onClick={() => handleDelete(app.nom)}
              >❌ Supprimer</button>
            </li>
          ))}
        </ul>
      </div>

      {/* Colonne droite */}
      <div style={{ flex: 2 }}>
        <h2>Logs en direct</h2>
        {Object.entries(logs).map(([nom, data]) => {
          const lignes = data.lines || [];
          return (
            <div key={nom} style={{ marginBottom: 30 }}>
              <h4>{nom}</h4>
              <div
                ref={(el) => (logRefs.current[nom] = el)}
                style={{
                  height: '400px',
                  width: '175%',
                  maxWidth: '800px',
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
          );
        })}
      </div>
    </div>
  );
}

export default App;

