const express = require('express');
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
    const examCollection = client
      .db('HSTUOnlineServices')
      .collection('examQuestions');

    // GET METHODS
    // app.get('/examQuestions/:studentId', async (req, res) => {
    //   const studentId = req.params;
    //   const result=await examCollection.findOne()
    //   console.log(studentId)
    // });
    app.put('/updateQuestion', async (req, res) => {
      const { questionId } = req.query;
      const updatedQuestions = req.body;
      const filter = { _id: ObjectId(questionId) };
      const updatedDoc = {
        $set: updatedQuestions
      };
      const result = await examCollection.updateOne(filter, updatedDoc);
      res.send({ result });
    });

    app.get('/examQuestions', async (req, res) => {
      const { department, level, semester, examMode, studentId } = req.query;
      let questions;
      if (examMode === 'new') {
        questions = await examCollection
          .find({
            examCompleted: false,
            department,
            level,
            semester
          })
          .toArray();
        const isParticipated = questions.find((question) =>
          question.answers.find((answer) => answer.studentId === studentId)
        );

        const filteredQuestions = [];
        questions.map((question) => {
          const { answers, ...restQuestions } = question;
          filteredQuestions.push(restQuestions);
        });

        if (!isParticipated) {
          return res.send(filteredQuestions);
        } else {
          return res.send(false);
        }
      }
    });

    // POST METHODS
    app.post('/examQuestions', async (req, res) => {
      const examQuestion = req.body;
      const result = await examCollection.insertOne(examQuestion);
      res.send(result);
    });
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
