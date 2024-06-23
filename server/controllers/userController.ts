import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../models/User.js';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleAuth = async (req: Request, res: Response) => {
  const { token } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const userid = payload!['sub'];

    const currentUser = await User.findOne({ googleId: userid });
    if (currentUser) {
      // already have the user
      req.session.user = currentUser;
      res.json(currentUser);
    } else {
      // if not, create user in our db
      const newUser = new User({
        googleId: userid,
        username: payload!.name,
        email: payload!.email,
        photo: payload!.picture,
        // add other attributes 
      });
      await newUser.save();
      req.session.user = newUser;
      res.json(newUser);
    }
  } catch (error) {
    res.status(500).json({ error: 'An error occurred during authentication' });
  }
};

export const getCurrentUser = (req: Request, res: Response) => {
  if (req.session.user) {
    res.json(req.session.user);
  } else {
    res.status(401).json({ message: 'Not logged in' });
  }
};
