import mongoose, { Document, Schema } from 'mongoose';

interface IUser {
  googleId: string;
  username: string;
  email: string;
  photo: string;  // add this line
  created: Date;
  role: string;
}

// Define the Mongoose document type, which includes the IUser interface
interface UserDocument extends IUser, Document {}

const userSchema = new Schema<UserDocument>({
  googleId: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  // You can add additional fields as necessary. For example:
  email: String,
  photo: String,  // add this line
  created: { type: Date, default: Date.now },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  }
});

const User = mongoose.model<UserDocument>('User', userSchema);

export { User, UserDocument, IUser };
