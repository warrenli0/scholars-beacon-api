import { Request, Response } from 'express';
import UserAnalytics from '../models/UserAnalytics.js';
import Question from '../models/Question.js';

export const getUserQuestions = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { page, limit } = req.query;
  const pageInt = parseInt(page as string) || 1;
  const limitInt = parseInt(limit as string) || 10;

  try {
    let completedQuestionIds: any[] = [];
    if (userId) {
      const analytics = await UserAnalytics.findOne({ userId });
      completedQuestionIds = analytics ? analytics.completedQuestions.map(q => q.questionId.toString()) : [];
    }

    const questions = await Question.find()
      .skip((pageInt - 1) * limitInt)
      .limit(limitInt)
      .lean();

    const questionsWithCompletionStatus = questions.map(question => ({
      ...question,
      completed: userId ? completedQuestionIds.includes(question._id.toString()) : false,
    }));

    const totalQuestions = await Question.countDocuments();

    res.json({
      questions: questionsWithCompletionStatus,
      totalPages: Math.ceil(totalQuestions / limitInt),
      currentPage: pageInt
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching questions.' });
  }
};

export const submitAnswer = async (req: Request, res: Response) => {
  const { userId, questionId, isCorrect, isUnderstood } = req.body;

  try {
    const question = await Question.findById(questionId);

    if (!question) {
      res.status(404).json({ error: 'Question not found.' });
      return;
    }

    let analytics = await UserAnalytics.findOne({ userId });

    if (!analytics) {
      analytics = new UserAnalytics({
        userId,
        totalQuestionsAnswered: 0,
        totalCorrectAnswers: 0,
        categoryPerformance: [],
        difficultyPerformance: [],
        completedQuestions: [],
      });
    }

    const isAlreadyAnswered = analytics.completedQuestions.some(q => q.questionId.toString() === questionId.toString());

    if (!isAlreadyAnswered) {
      analytics.totalQuestionsAnswered += 1;
      if (isCorrect) {
        analytics.totalCorrectAnswers += 1;
      }

      let categoryStat = analytics.categoryPerformance.find(cp => cp.category === question.category);
      if (!categoryStat) {
        categoryStat = { category: question.category, totalQuestions: 0, correctAnswers: 0 };
        analytics.categoryPerformance.push(categoryStat);
      }
      categoryStat.totalQuestions += 1;
      if (isCorrect) {
        categoryStat.correctAnswers += 1;
      }

      let difficultyStat = analytics.difficultyPerformance.find(dp => dp.difficulty === question.difficulty);
      if (!difficultyStat) {
        difficultyStat = { difficulty: question.difficulty, totalQuestions: 0, correctAnswers: 0 };
        analytics.difficultyPerformance.push(difficultyStat);
      }
      difficultyStat.totalQuestions += 1;
      if (isCorrect) {
        difficultyStat.correctAnswers += 1;
      }

      analytics.completedQuestions.push({ questionId, isCorrect, isUnderstood });

      await analytics.save();
    }

    res.json({ message: 'User analytics updated successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while updating user analytics.' });
  }
};
