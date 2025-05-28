const express = require('express');
const { spawn } = require('child_process');
const http = require('http');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const PORT = 3001;
let deployedApps = [];

app.use(cors());
app.use(bodyParser.json());

// Lister les apps
app.get('/terraform/apps', (req, res) => {
  res.json(deployedApps);
});

// Déployer une app avec logs live
app.post('/terraform/apply', (req, res) => {
  const { nom, port } = req.body;
  if (!nom || !port) 
    return res.status(400).send('Nom et port requis');

  const exists = deployedApps.find(app => app.nom === nom || parseInt(app.port) === parseInt(port)) || nom === port;
  if (exists) return res.status(409).send('Application déjà déployée');

  const command = `for i in {1..4}; do echo "Déploiement $i pour ${nom}:${port}"; sleep 1; done`;
  const child = spawn('bash', ['-c', command]);

  child.stdout.on('data', (data) => {
    io.emit(`output-${nom}`, data.toString());
  });

  child.stderr.on('data', (data) => {
    io.emit(`output-${nom}`, `ERREUR: ${data.toString()}`);
  });

  child.on('close', (code) => {
    io.emit(`output-${nom}`, `Fin du script avec code ${code}`);
  });

  deployedApps.push({ nom, port });
  res.send('Déploiement en cours');
});


// Supprimer une app
app.delete('/terraform/destroy', (req, res) => {
  const { nom } = req.body;
  if (!nom) return res.status(400).send('Nom requis');

  const targetApp = deployedApps.find(app => app.nom === nom);
  if (!targetApp) return res.status(404).send('App non trouvée');

  const { port } = targetApp;
  const command = `for i in {1..3}; do echo "Suppression $i pour ${nom}:${port}"; sleep 1; done`;
  const child = spawn('bash', ['-c', command]);

  child.stdout.on('data', (data) => {
    io.emit(`output-${nom}`, data.toString());
  });

  child.stderr.on('data', (data) => {
    io.emit(`output-${nom}`, `ERREUR: ${data.toString()}`);
  });

  child.on('close', (code) => {
    io.emit(`output-${nom}`, `✅ Suppression terminée (${nom})`);

    // 👇 C’est CE signal que le front attend pour effacer les logs
    io.emit(`destroy-complete-${nom}`);
  });

  // Supprimer du tableau
  deployedApps = deployedApps.filter(app => app.nom !== nom);

  res.send('Suppression en cours');
});



io.on('connection', (socket) => {
  console.log('✅ Client connecté');
  socket.on('disconnect', () => {
    console.log('❌ Client déconnecté');
  });
});

server.listen(PORT, () => {
  console.log(`✅ Serveur WebSocket + REST sur http://localhost:${PORT}`);
});
