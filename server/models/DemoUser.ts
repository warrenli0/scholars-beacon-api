import mongoose, { Document, Schema } from 'mongoose';

interface IUser {
  email: string;
  // New fields for SAT/ACT data
  choseSAT: boolean;
  satScores: any[]; // Assuming scores are stored as a Map of section to score
  satWeightage: any[];
  actScores: any[];
  actWeightage: any[];
  firstBetaButton: boolean;
  log: any; // For any additional logs or comments
}


// Define the Mongoose document type, which includes the IUser interface
interface UserDocument extends IUser, Document {}

const userSchema = new Schema<UserDocument>({
  // You can add additional fields as necessary. For example:
  email: String,
  choseSAT: {
    type: Boolean,
    required: false,
  },
  satScores: {
    type: [],
    required: false,
  },
  satWeightage: {
    type: [],
    required: false,
  },
  actScores: {
    type: [],
    required: false,
  },
  actWeightage: {
    type: [],
    required: false,
  },
  firstBetaButton: {
    type: Boolean,
    required: false,
  },
  log: {
    type: String,
    required: false,
  },
});

const DemoUser = mongoose.model<UserDocument>('DemoUser', userSchema);

export default DemoUser;
