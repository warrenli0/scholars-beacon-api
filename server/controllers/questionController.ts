import { Request, Response } from 'express';
import CalcQuestion from '../models/CalcQuestion.js';
import MathQuestion from '../models/MathQuestion.js';
import ReadingQuestion from '../models/ReadingQuestion.js';
import GrammarQuestion from '../models/GrammarQuestion.js';
import ScienceQuestion from '../models/ScienceQuestion.js';
import Question from '../models/Question.js';

const getQuestionModel = (type: string) => {
  switch (type.toLowerCase()) {
    case 'calc':
      return CalcQuestion;
    case 'math':
      return MathQuestion;
    case 'reading':
      return ReadingQuestion;
    case 'grammar':
      return GrammarQuestion;
    case 'science':
      return ScienceQuestion;
    default:
      return null;
  }
};

export const addQuestions = async (req: Request, res: Response) => {
  const { type } = req.params;

  const questionModel = getQuestionModel(type);
  if (!questionModel) {
    res.status(400).json({ message: 'Invalid question type provided' });
    return;
  }

  try {
    const question = new questionModel(req.body);
    await question.save();
    res.json({ message: 'Question added successfully!' });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while adding the question' });
  }
};

export const getQuestions = async (req: Request, res: Response) => {
  const { page, limit } = req.query;
  const pageInt = parseInt(page as string) || 1;
  const limitInt = parseInt(limit as string) || 10;

  try {
    const questions = await Question.find()
      .skip((pageInt - 1) * limitInt)
      .limit(limitInt);

    const totalQuestions = await Question.countDocuments();

    res.json({
      questions,
      totalPages: Math.ceil(totalQuestions / limitInt),
      currentPage: pageInt
    });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching questions' });
  }
};

export const getQuestionById = async (req: Request, res: Response) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      res.status(404).json({ message: 'Question not found' });
      return;
    }
    res.json(question);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching the question' });
  }
};
