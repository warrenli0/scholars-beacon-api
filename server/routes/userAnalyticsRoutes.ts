import { Router } from 'express';
import { getUserQuestions, submitAnswer } from '../controllers/userAnalyticsController.js';

const router = Router();

router.get('/user/:userId?/questions', getUserQuestions);
router.post('/submit-answer', submitAnswer);

export default router;
