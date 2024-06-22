import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    email: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const UserEmail = mongoose.model('UserEmail', userSchema);

export default UserEmail;