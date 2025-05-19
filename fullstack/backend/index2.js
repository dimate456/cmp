const express = require('express');
const { exec } = require('child_process');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const PORT = 3001;
app.use(cors());
app.use(bodyParser.json());
// const TERRAFORM_DIR = '/mnt/d/terraform'; // l'endroit où terraform est installé

// si frontend sur un autre domaine ou port
// const cors = require('cors');
// app.use(cors());
let deployedApps = [];

app.post('/terraform/apply', (req, res) => {
  const { nom, port } = req.body;
  if (!nom || !port) return res.status(400).send('nom et port requis');

  

  exec('echo Hello_World', (error, stdout) => {
    if (error) return res.status(500).send('Erreur Terraform Apply');
    deployedApps.push({ nom, port });
    res.send(stdout);
  });
});

app.delete('/terraform/destroy', (req, res) => {
  const { nom } = req.body;
  if (!nom) return res.status(400).send('nom requis');

  exec('echo Good_Bye_World', (error, stdout) => {
    if (error) return res.status(500).send('Erreur Terraform Destroy');
    deployedApps = deployedApps.filter(app => app.nom !== nom);
    res.send(stdout);
  });
});

app.get('/terraform/apps', (req, res) => {
  res.json(deployedApps);
});

app.listen(PORT, () => {
    console.log(`Backend terraform sur le port ${PORT}`);
});