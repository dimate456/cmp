const express = require('express');
const cors = require('cors'); 

const app = express();
const port = 5000;

app.use(cors());

app.get('/api/hello', (req, res) => {
    res.json({
        message: `Russell t'es trop bg et tu sens trop bon`
      });
    });



app.listen(port, () => {
  console.log(`Serveur backend sur http://localhost:${port}`);
});
