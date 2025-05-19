const express = require('express');
const { exec } = require('child_process');
const cors = require('cors');
const app = express();
const PORT = 3001;
app.use(cors());
// const TERRAFORM_DIR = '/mnt/d/terraform'; // l'endroit où terraform est installé

// si frontend sur un autre domaine ou port
// const cors = require('cors');
// app.use(cors());

app.post('/terraform/apply', (req, res) => {
    /*const command = 'echo Hello_World';
    exec(command, { cwd: TERRAFORM_DIR }, (error, stdout, stderr) => {
        if (error) {
            console.log('Erreur durant terraform apply :', error);
            return res.status(500).send('Error terraform apply');
        }
        res.send(stdout);
    });*/
    exec('echo Hello_World', (error, stdout, stderr) => {
        if (error) {
            console.log("Erreur test minimal:", error);
            return res.status(500).send('Error terraform apply');
        } else {
            console.log("Test réussi:", stdout);
            res.send(stdout);
        }
    });
});

app.delete('/terraform/destroy', (req, res) => {
  exec('echo Good_Bye_World', (error, stdout, stderr) => {
    if (error) {
      console.log("Erreur test minimal (destroy):", error);
      return res.status(500).send('Error terraform destroy');
    } else {
      console.log("Test réussi (destroy):", stdout);
      res.send(stdout);
    }
  });
});


app.listen(PORT, () => {
    console.log(`Backend terraform sur le port ${PORT}`);
});