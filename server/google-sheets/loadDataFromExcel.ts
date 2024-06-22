// loadDataFromExcel.ts
import mongoose, { ConnectOptions } from 'mongoose';
import dotenv from 'dotenv';
import xlsx from 'xlsx';
import GrammarQuestion from '../models/GrammarQuestion.js';
import MathQuestion from '../models/MathQuestion.js';
import ReadingQuestion from '../models/ReadingQuestion.js';
import Question from '../models/Question.js';

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
  
      // Load Excel file
      const workbook = xlsx.readFile('google-sheets/SB V.5 Qs.xlsx');
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
  
      // Convert sheet to JSON
      const rows: any[][] = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  
      if (rows.length) {
        const header = rows.shift(); // Remove header row
  
        for (const row of rows) {
          if (row.length < 12) continue; // Ensure row has enough columns
  
          const category = row[0] as string;
          const topic = row[1] as string;
          const problemStatement = row[3] as string;
          const questionText = row[4] as string;
          const answerChoices = [
            { text: row[5] as string, isCorrect: row[9] === 'A' },
            { text: row[6] as string, isCorrect: row[9] === 'B' },
            { text: row[7] as string, isCorrect: row[9] === 'C' },
            { text: row[8] as string, isCorrect: row[9] === 'D' },
          ];
          const explanation = row[10] as string;
          const difficulty = row[11] as 'Easy' | 'Medium' | 'Hard';
  
          const questionData = {
            type: category,
            category,
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

          const question = new Question(questionData);
          await question.save();
  
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
