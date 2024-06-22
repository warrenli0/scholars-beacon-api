import mongoose, { Document, Schema } from 'mongoose';

interface ICategoryPerformance {
  category: string;
  totalQuestions: number;
  correctAnswers: number;
}

interface IDifficultyPerformance {
  difficulty: string;
  totalQuestions: number;
  correctAnswers: number;
}

interface ICompletedQuestion {
  questionId: Schema.Types.ObjectId;
  isCorrect: boolean;
  isUnderstood: boolean;
}

interface IUserAnalytics {
  userId: Schema.Types.ObjectId;
  totalQuestionsAnswered: number;
  totalCorrectAnswers: number;
  categoryPerformance: ICategoryPerformance[];
  difficultyPerformance: IDifficultyPerformance[];
  completedQuestions: ICompletedQuestion[];
}

interface UserAnalyticsDocument extends IUserAnalytics, Document {}

const categoryPerformanceSchema = new Schema<ICategoryPerformance>({
  category: {
    type: String,
    required: true,
  },
  totalQuestions: {
    type: Number,
    required: true,
  },
  correctAnswers: {
    type: Number,
    required: true,
  },
});
categoryPerformanceSchema.index({ category: 1 });

const difficultyPerformanceSchema = new Schema<IDifficultyPerformance>({
  difficulty: {
    type: String,
    required: true,
  },
  totalQuestions: {
    type: Number,
    required: true,
  },
  correctAnswers: {
    type: Number,
    required: true,
  },
});
difficultyPerformanceSchema.index({ difficulty: 1 });

const completedQuestionSchema = new Schema<ICompletedQuestion>({
  questionId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  isCorrect: {
    type: Boolean,
    required: true,
  },
  isUnderstood: {
    type: Boolean,
    required: false,
  },
});

const userAnalyticsSchema = new Schema<UserAnalyticsDocument>({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  totalQuestionsAnswered: {
    type: Number,
    required: true,
  },
  totalCorrectAnswers: {
    type: Number,
    required: true,
  },
  categoryPerformance: [categoryPerformanceSchema],
  difficultyPerformance: [difficultyPerformanceSchema],
  completedQuestions: [completedQuestionSchema],
});
userAnalyticsSchema.index({ userId: 1 });

const UserAnalytics = mongoose.model<UserAnalyticsDocument>('UserAnalytics', userAnalyticsSchema);

export default UserAnalytics;
