import { Request, Response } from 'express';
import Post from '../models/Post.js';

export const getAllPosts = async (req: Request, res: Response) => {
  try {
    const posts = await Post.find().populate('user', 'username email photo');
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching posts' });
  }
};

export const getPostById = async (req: Request, res: Response) => {
  try {
    const post = await Post.findById(req.params.id).populate('user', 'username email photo');
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    return res.json(post);
  } catch (error) {
    return res.status(500).json({ error: 'An error occurred while fetching the post' });
  }
};

export const createPost = async (req: Request, res: Response) => {
  try {
    const post = new Post({
      title: req.body.title,
      content: req.body.content,
      created_by: req.body.created_by,
      created_at: req.body.created_at,
    });
    const saved = await post.save();
    res.json({ message: 'Post created successfully!', id: saved._id });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while creating the post' });
  }
};

export const addComment = async (req: Request, res: Response) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = {
      text: req.body.text,
      created_by: req.body.created_by,
    };
    post.comments.push(comment);
    await post.save();
    return res.json({ message: 'Comment added successfully!' });
  } catch (error) {
    return res.status(500).json({ error: 'An error occurred while adding the comment' });
  }
};
