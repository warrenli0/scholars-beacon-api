import { Router } from 'express';
import { addQuestions, getQuestions, getQuestionById } from '../controllers/questionController.js';

const router = Router();

router.post('/add-questions/:type', addQuestions);
router.get('/questions', getQuestions);
router.get('/questions/:id', getQuestionById);

export default router;
