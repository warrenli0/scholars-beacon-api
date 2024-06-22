import mongoose, { Document, Schema } from 'mongoose';

interface IUser {
  email: string;
  // New fields for SAT/ACT data
  personType: string;
  name: string;
  location: string;
  message: string;
}


// Define the Mongoose document type, which includes the IUser interface
interface UserDocument extends IUser, Document {}

const userSchema = new Schema<UserDocument>({
  // You can add additional fields as necessary. For example:
  email: String,
  personType: {
    type: String,
    required: false,
  },
  name: {
    type: String,
    required: false,
  },
  location: {
    type: String,
    required: false,
  },
  message: {
    type: String,
    required: false,
  },
});

const UserFeedback = mongoose.model<UserDocument>('UserFeedback', userSchema);

export default UserFeedback;
