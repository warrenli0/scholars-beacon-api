import mongoose, { Document, Schema } from 'mongoose';

enum Difficulty {
  Easy = 'Easy',
  Medium = 'Medium',
  Hard = 'Hard',
}

interface IAnswerChoice {
  text: string;
  isCorrect: boolean;
}

interface AnswerChoiceDocument extends IAnswerChoice, Document {}

const answerChoiceSchema = new Schema<AnswerChoiceDocument>({
  text: {
    type: String,
    required: true,
  },
  isCorrect: {
    type: Boolean,
    default: false,
  },
});

interface IQuestion {
  type: string;
  title: string;
  problemStatement: string;
  question: string;
  difficulty: Difficulty;
  topic: string;
  answerChoices: AnswerChoiceDocument[];
  has_img: boolean;
  img_link: string;
  explanation: string;
  author: string;
}

interface QuestionDocument extends IQuestion, Document {}

const questionSchema = new Schema<QuestionDocument>({
  type: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  problemStatement: {
    type: String,
    required: true,
  },
  question: {
    type: String,
    required: true,
  },
  difficulty: {
    type: String,
    enum: Object.values(Difficulty),
    required: true,
  },
  topic: {
    type: String,
    required: true,
  },
  answerChoices: {
    type: [answerChoiceSchema],
    validate: [arrayLimit, '{PATH} exceeds the limit of 4']
  },
  has_img: {
    type: Boolean,
    required: true,
  },
  img_link: {
    type: String,
    required: false,
  },
  explanation: {
    type: String,
    required: false,
  },
  author: {
    type: String,
    required: false,
  },
});

function arrayLimit(val: any[]) {
  return val.length <= 4;
}

const GrammarQuestion = mongoose.model<QuestionDocument>('GrammarQuestion', questionSchema, 'grammarQuestions');

export default GrammarQuestion;
