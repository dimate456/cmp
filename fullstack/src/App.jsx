import React, { useState } from 'react';
import './App.css';

function App() {
  const [apps, setApps] = useState([]);
  const [newApp, setNewApp] = useState({ nom: '', port: '' });
  const [responseData, setResponseData] = useState(null);

  const handleTerraformApply = async () => {
    try {
      const response = await fetch('http://4.180.4.209:3001/terraform/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newApp),
      });

      const data = await response.text();
      if (!response.ok) throw new Error(data);
      setResponseData({ message: data });
      setApps([...apps, { ...newApp }]);
      setNewApp({ nom: '', port: '' }); // reset
    } catch (error) {
      setResponseData({ message: error.message });
    }
  };

  const handleTerraformDelete = async (nom) => {
    try {
      const response = await fetch('http://4.180.4.209:3001/terraform/destroy', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom }),
      });

      const data = await response.text();
      if (!response.ok) throw new Error(data);
      setResponseData({ message: data });
      setApps(apps.filter(app => app.nom !== nom));
    } catch (error) {
      setResponseData({ message: error.message });
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Créer une application</h2>
      <input
        type="text"
        placeholder="Nom"
        value={newApp.nom}
        onChange={(e) => setNewApp({ ...newApp, nom: e.target.value })}
        style={{ marginRight: 10 }}
      />
      <input
        type="number"
        placeholder="Port"
        value={newApp.port}
        onChange={(e) => setNewApp({ ...newApp, port: parseInt(e.target.value) })}
        style={{ marginRight: 10 }}
      />
      <button onClick={handleTerraformApply}>🚀 Créer</button>

      <h3 style={{ marginTop: 30 }}>Applications déployées</h3>
      <ul>
        {apps.map((app) => (
          <li key={app.nom}>
            {app.nom} (port {app.port}){' '}
            <button onClick={() => handleTerraformDelete(app.nom)}>❌ Supprimer</button>
          </li>
        ))}
      </ul>

      <div style={{ marginTop: 20 }}>
        {responseData?.message?.split('\n').map((line, index) => (
          <span key={index}>{line}<br /></span>
        ))}
      </div>
    </div>
  );
}

export default App;
