import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import mongoose, { ConnectOptions } from "mongoose";
import session from 'express-session';
import passport from 'passport';
import { OAuth2Client } from 'google-auth-library';
import { Request, Response, NextFunction } from "express";
import { config } from 'dotenv';
import { rateLimit } from 'express-rate-limit'

import moduleRoutes from './routes/moduleRoutes.js'
import betaPageRoutes from './routes/betaPageRoutes.js'
import questionRoutes from './routes/questionRoutes.js';
import postRoutes from './routes/postRoutes.js';
import userAnalyticsRoutes from './routes/userAnalyticsRoutes.js';
import userRoutes from './routes/userRoutes.js';

// REMEMBER TO RUN `TSC` BEFORE `EB DEPLOY` !!!!!!!!!!!!!!!!

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      MONGODB_URI: string;
      GOOGLE_CLIENT_ID: string;
      PORT: string;
      SESSION_SECRET: string;
    }
  }
}

declare module 'express-session' {
  export interface SessionData {
    user: { [key: string]: any };
  }
}

config();

function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

// Middleware to check if the user is an admin
function ensureAdmin(req: Request, res: Response, next: NextFunction) {
  // if (req.user && (req.user as UserDocument).role === "admin") {
  //   return next();
  // }
  // res.status(403).json({ message: "Forbidden" });
}

const app = express();

app.set('trust proxy', 1);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 100 requests per 15 minutes
  message: 'Too many requests from this IP, please try again after 15 minutes'
});

app.use('/api', apiLimiter);
app.use(bodyParser.json());

// Setup API Routes
app.use('/api', moduleRoutes);
app.use('/api', betaPageRoutes);
app.use('/api', questionRoutes);
app.use('/api', postRoutes);
app.use('/api', userAnalyticsRoutes);
app.use('/', userRoutes);

const allowedOrigins = ['https://warrenli0.github.io', 'http://localhost:3000', 'https://scholarsbeacon.net'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      var msg = 'The CORS policy for this site does not ' +
                'allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
}));

// If having trouble with CORS, use the following code instead of the above
// app.use(cors({
//   origin: '*',
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
//   credentials: true
// }));

// app.use((req, res, next) => {
//   res.header('Access-Control-Allow-Origin', '*'); // Update this to specific domain in production
//   res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
//   res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
//   next();
// });

app.use(session({ secret: process.env.SESSION_SECRET, resave: true, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true } as ConnectOptions);

const db = mongoose.connection;
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log("Successfully connected to MongoDB!");
});

app.get('/', async (req, res) => {
  res.status(201).send({ message: "Hello!" });
});

const port = process.env.PORT || '5000';

app.listen(port, () => console.log(`Server started on port ${port}`));
