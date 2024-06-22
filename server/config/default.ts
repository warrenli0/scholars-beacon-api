import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, './../../.env') });

console.log("MONGODB_URI", process.env.MONGODB_URI);

export default {
  port: process.env.PORT || 3000,
  dbConnectionString: process.env.MONGODB_URI || '',
  // Other configurations
};
