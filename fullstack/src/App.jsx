import React, { useState } from 'react';
import './App.css';

function App() {
  const [responseData, setResponseData] = useState(null);

  const handleTerraformApply = async () => {
    try {
      const response = await fetch('http://4.180.4.209:3001/terraform/apply', {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Erreur pendant Terraform Apply');
      const data = await response.text(); // ici on reçoit du texte brut, pas du JSON
      setResponseData({ message: data });
    } catch (error) {
      console.error(error);
      setResponseData({ message: 'Erreur lors du lancement de Terraform Apply' });
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <button onClick={handleTerraformApply} className="apply-button">
        🚀 Lancer Terraform Apply
      </button>

      <div style={{ marginTop: 20 }}>
        {responseData?.message
          ?.split('\n')
          .map((line, index) => (
            <span key={index}>
              {line}
              <br />
            </span>
          ))}
      </div>
    </div>
  );
}

export default App;
