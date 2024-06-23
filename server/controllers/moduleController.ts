import { Request, Response } from 'express';
import Module from '../models/Module.js';

export const getAllModules = async (req: Request, res: Response) => {
  try {
    const modules = await Module.find().populate('questions');
    res.json(modules);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching modules.' });
  }
};

export const getModuleById = async (req: Request, res: Response) => {
  try {
    const module = await Module.findById(req.params.id).populate('questions');
    if (module) {
      res.json(module);
    } else {
      res.status(404).json({ message: 'Module not found.' });
    }
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching the module.' });
  }
};

export const createModule = async (req: Request, res: Response) => {
  try {
    const { title, category, topic, estimatedTime, description, questions } = req.body;
    const newModule = new Module({ title, category, topic, estimatedTime, description, questions });
    const savedModule = await newModule.save();
    res.status(201).json({ message: 'Module created successfully!', module: savedModule });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while creating the module.' });
  }
};
