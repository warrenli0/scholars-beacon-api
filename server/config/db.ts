import mongoose, { ConnectOptions } from 'mongoose';
import config from './default';

const connectDB = async () => {
  try {
    await mongoose.connect(config.dbConnectionString, {} as ConnectOptions);
    console.log('MongoDB connected successfully: ', config.dbConnectionString);
  } catch (error) {
    console.error('Error connecting to MongoDB', error);
    process.exit(1);
  }
};

export default connectDB;
