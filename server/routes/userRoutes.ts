import { Router } from 'express';
import { googleAuth, getCurrentUser } from '../controllers/userController.js';

const router = Router();

router.post('/auth/google', googleAuth);
router.get('/auth/current_user', getCurrentUser);

export default router;
