import mongoose, { Schema, Document } from 'mongoose';

interface IModule extends Document {
  title: string;
  category: string;
  topic: string;
  estimatedTime: number;
  description: string;
  questions: string[];
}

const ModuleSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  topic: { type: String, required: true },
  estimatedTime: { type: Number, required: true },
  questions: { type: [String], required: true },
});

const Module = mongoose.model<IModule>('Module', ModuleSchema);

export default Module;
