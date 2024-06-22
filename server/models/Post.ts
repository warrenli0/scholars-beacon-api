import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
text: String,
// created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
created_by: String,
created_at: { type: Date, default: Date.now }
});

const PostSchema = new mongoose.Schema({
  title: String,
  content: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_by: String,
  created_at: { type: Date, default: Date.now },
  comments: [commentSchema],
});

export default mongoose.model('Post', PostSchema);
