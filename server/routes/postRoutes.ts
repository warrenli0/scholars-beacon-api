import { Router } from 'express';
import { getAllPosts, getPostById, createPost, addComment } from '../controllers/postController.js';

const router = Router();

router.get('/posts', getAllPosts);
router.get('/posts/:id', getPostById);
router.post('/posts', createPost);
router.post('/posts/:id/comments', addComment);

export default router;
