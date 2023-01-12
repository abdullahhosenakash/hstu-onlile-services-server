const express = require('express');
const cors = require('cors');
require('dotenv').config();
const crypto = require('crypto');
const port = process.env.PORT || 5000;
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@hstuonlineservices.9l05rg8.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

app.use(cors());
app.use(express.json());

async function run() {
  try {
    await client.connect();
    const examCollection = client
      .db('HSTUOnlineServices')
      .collection('examQuestions');
    const teacherCollection = client
      .db('HSTUOnlineServices')
      .collection('teachers');
    const studentCollection = client
      .db('HSTUOnlineServices')
      .collection('students');

    app.put('/updateQuestion', async (req, res) => {
      const { questionId } = req.query;
      const updatedQuestions = req.body;
      const filter = { _id: ObjectId(questionId) };
      const updatedDoc = {
        $set: updatedQuestions,
      };
      const result = await examCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    app.put('/evaluateAnswers', async (req, res) => {
      const { questionId } = req.query;
      const { studentId, givenMarks } = req.body;
      const filter = { _id: ObjectId(questionId) };

      const totalAnswers = (await examCollection.findOne(filter)).answers;
      const selectedAnswer = totalAnswers.find(
        (answer) => answer.studentId === studentId
      );
      const restAnswers = totalAnswers.filter(
        (answer) => answer.studentId !== studentId
      );
      const modifiedAnswer = {
        ...selectedAnswer,
        obtainedMark: givenMarks,
        evaluated: true,
      };

      const updatedAnswers = [...restAnswers, modifiedAnswer];

      const updatedDoc = {
        $set: { answers: updatedAnswers },
      };
      const result = await examCollection.updateOne(filter, updatedDoc);
      res.send(result);
      // console.log(modifiedAnswer);
    });

    app.put('/updateAnswer', async (req, res) => {
      const { questionId } = req.query;
      const { studentId, answersOfQuestions } = req.body;
      const filter = { _id: ObjectId(questionId) };
      const totalAnswers = (await examCollection.findOne(filter)).answers;
      const isAnswerAvailable = totalAnswers.find(
        (answers) => answers.studentId === studentId
      );

      if (isAnswerAvailable) {
        return res.send({ message: 'Answer has already submitted' });
      } else {
        const updatedAnswers = [
          ...totalAnswers,
          {
            studentId,
            answersOfQuestions,
            evaluated: false,
            obtainedMark: '',
          },
        ];
        const updatedDoc = {
          $set: { answers: updatedAnswers },
        };
        // console.log(updatedDoc);
        const result = await examCollection.updateOne(filter, updatedDoc);
        res.send({ result });
      }
    });

    app.put('/updateUser', async (req, res) => {
      const { userId, userMode } = req.query;
      const updatedUser = req.body;
      if (userMode === 'student') {
        const filter = { userId };
        const updatedDoc = {
          $set: updatedUser,
        };
        const result = await studentCollection.updateOne(filter, updatedDoc);
        res.send(result);
      }
    });

    // GET METHODS

    app.get('/teacherExamQuestions', async (req, res) => {
      const teacherId = req.query;
      const result = await examCollection.find(teacherId).toArray();
      res.send(result);
    });

    app.get('/examQuestions', async (req, res) => {
      const { department, level, semester, examMode, studentId } = req.query;
      const questions = await examCollection
        .find({
          examCompleted: examMode === 'new' ? false : true,
          department,
          level,
          semester,
        })
        .toArray();

      if (examMode === 'old') {
        const oldQuestions = questions.filter(
          (question) => question.examCompleted === true
        );
        const filteredOldQuestions = oldQuestions.map((oldQuestion) => {
          const { answers, ...restProperties } = oldQuestion;
          return restProperties;
        });
        return res.send(filteredOldQuestions);
      } else {
        const newQuestions = questions.filter(
          (question) => question.examCompleted === false
        );
        const filteredNewQuestions = newQuestions.map((oldQuestion) => {
          const { answers, ...restProperties } = oldQuestion;
          const isParticipated = answers.find(
            (answer) => answer.studentId === studentId
          );
          if (isParticipated) {
            return { ...restProperties, participated: true };
          } else {
            return { ...restProperties, participated: false };
          }
        });
        return res.send(filteredNewQuestions);
      }
    });

    // POST METHODS
    app.post('/examQuestions', async (req, res) => {
      const examQuestion = req.body;
      const result = await examCollection.insertOne(examQuestion);
      res.send(result);
    });

    app.post('/addUser', async (req, res) => {
      const { userMode } = req.query;
      const newUser = req.body;

      if (userMode === 'student') {
        const availableStudent = await studentCollection.findOne({
          studentId: newUser.studentId,
        });
        if (availableStudent) {
          res.send({ message: 'Student already exists' });
        } else {
          let userId;
          while (1) {
            userId = crypto.randomBytes(4).toString('hex').toUpperCase();
            if (!(await studentCollection.findOne({ userId }))) {
              break;
            }
          }
          const newUserWithUserId = { ...newUser, userId };
          const result = await studentCollection.insertOne(newUserWithUserId);
          res.send({ result, userId });
        }
      } else {
        // isAvailable=await teacherCollection.findOne(newUser.studentId);
      }

      // console.log(isAvailable);
    });

    app.post('/findUser', async (req, res) => {
      const { userId, userMode } = req.body;
      let result;
      if (userMode === 'student') {
        result = await studentCollection.findOne({ userId });
      } else {
        result = await teacherCollection.findOne({ userId });
      }
      if (result) {
        if (result.userEmail) {
          res.send({ result: 1 });
        } else {
          res.send({ result: 0 });
        }
      } else {
        res.send({ result: 'error' });
      }
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
