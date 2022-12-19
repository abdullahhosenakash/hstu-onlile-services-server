const express = require('express');
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;
const app = express();
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@hstuonlineservices.9l05rg8.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1
});

app.use(cors());
app.use(express.json());

async function run() {
  try {
    await client.connect();
    console.log('connected');
  } finally {
  }
}

run().catch(console.dir);

app.get('/', async (req, res) => {
  res.send('HSTU Online Server Running');
});

app.listen(port, () => {
  console.log('HSTU Online Server running on port', port);
});
