// loadData.ts
import mongoose, { ConnectOptions } from 'mongoose';
import dotenv from 'dotenv';
import GrammarQuestion from '../models/GrammarQuestion.js';
import MathQuestion from '../models/MathQuestion.js';
import ReadingQuestion from '../models/ReadingQuestion.js';
import { getSheetData } from './sheets.js';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb+srv://kleinalo10:UtT7QE9E1FwoekP9@cluster0.u0wlifl.mongodb.net/?retryWrites=true&w=majority', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    } as ConnectOptions);
    console.log('MongoDB connected');
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

const loadData = async () => {
  try {
    await connectDB();
    const spreadsheetId = '1Mj8Xg_no_5_zM4pzjge5PhEoAmU8bWTAQd8GP8tMWls';
    const range = 'Sheet1!A:L';
    const rows = await getSheetData(spreadsheetId, range);

    if (rows.length) {
      const header = rows.shift(); // Remove header row

      for (const row of rows) {
        const category = row[0];
        const topic = row[1];
        const problemStatement = row[3];
        const questionText = row[4];
        const answerChoices = [
          { text: row[5], isCorrect: row[9] === 'A' },
          { text: row[6], isCorrect: row[9] === 'B' },
          { text: row[7], isCorrect: row[9] === 'C' },
          { text: row[8], isCorrect: row[9] === 'D' },
        ];
        const explanation = row[10];
        const difficulty = row[11] as 'Easy' | 'Medium' | 'Hard';

        const questionData = {
          type: category,
          title: topic,
          problemStatement,
          question: questionText,
          difficulty,
          topic,
          answerChoices,
          has_img: false,
          img_link: '',
          explanation,
          author: 'Unknown',
        };

        switch (category) {
          case 'Math':
            const mathQuestion = new MathQuestion(questionData);
            await mathQuestion.save();
            break;
          case 'Reading':
            const readingQuestion = new ReadingQuestion(questionData);
            await readingQuestion.save();
            break;
          case 'Writing':
            const grammarQuestion = new GrammarQuestion(questionData);
            await grammarQuestion.save();
            break;
          default:
            console.log(`Unknown category: ${category}`);
        }
      }
      console.log('Data loaded successfully');
    } else {
      console.log('No data found');
    }
  } catch (error) {
    console.error(error);
  } finally {
    mongoose.connection.close();
  }
};

loadData();
