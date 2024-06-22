import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import mongoose, { ConnectOptions } from "mongoose";
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User, UserDocument } from './models/User.js';
import DemoUser from './models/DemoUser.js';
import UserFeedback from './models/UserFeedback.js';
import Question from './models/Question.js';
import MathQuestion from './models/MathQuestion.js';
import CalcQuestion from './models/CalcQuestion.js';
import GrammarQuestion from './models/GrammarQuestion.js';
import ReadingQuestion from './models/ReadingQuestion.js';
import ScienceQuestion from './models/ScienceQuestion.js';
import UserAnalytics from './models/UserAnalytics.js';
import UserEmail from './models/UserEmail.js';
import Module from './models/Module.js';
import Post from './models/Post.js';
import nodemailer from 'nodemailer';
import { OAuth2Client } from 'google-auth-library';
import { Request, Response, NextFunction } from "express";
import { config } from 'dotenv';
import { rateLimit } from 'express-rate-limit'

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

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
      user: 'scholarsbeacon@gmail.com',
      pass: 'qvmu drpu pyvw lxvw'
  }
});

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

// Get all modules
app.get('/api/modules', async (req: Request, res: Response) => {
  try {
    const modules = await Module.find().populate('questions');
    res.json(modules);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching modules.' });
  }
});

// Get a specific module
app.get('/api/modules/:id', async (req: Request, res: Response) => {
  try {
    const module = await Module.findById(req.params.id).populate('questions');
    if (module) {
      res.json(module);
    } else {
      res.status(404).json({ message: 'Module not found.' });
    }
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching the module.' });
  }
});

// Create a new module
app.post('/api/add-module', async (req: Request, res: Response) => {
  try {
    const { title, category, topic, estimatedTime, description, questions } = req.body;
    const newModule = new Module({ title, category, topic, estimatedTime, description, questions });
    const savedModule = await newModule.save();
    res.status(201).json({ message: 'Module created successfully!', module: savedModule });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while creating the module.' });
  }
});

app.get('/five-sat', async (req, res) => {
  try {
    const { excludedIdString, area: areaQuery } = req.query;
    const area = typeof areaQuery === 'string' && areaQuery.trim() !== '' ? areaQuery : 'math';
    type AreaKey = 'math' | 'reading' | 'calc' | 'grammar';

    let excludedIds: string[] = [];
    if (typeof excludedIdString === 'string') {
      excludedIds = excludedIdString.split(',');
    }

    const areaSizes = { math: 1, reading: 1, calc: 1, grammar: 1 }; // Default sizes
    const modelMap = {
      math: MathQuestion,
      reading: ReadingQuestion,
      calc: CalcQuestion,
      grammar: GrammarQuestion
    };

    async function fetchQuestions(model: any, size: any, excludedIds: any) {
      let questions = await model.aggregate([
        { $match: { _id: { $nin: excludedIds } } },
        { $sample: { size } }
      ]);

      // If there aren't enough new questions, fetch the shortfall from the excluded ones
      if (questions.length < size) {
        const shortfall = size - questions.length;
        const fallbackQuestions = await model.aggregate([
          { $match: { _id: { $in: excludedIds } } }, // Note the $in operator to select from excludedIds
          { $sample: { size: shortfall } }
        ]);
        questions = questions.concat(fallbackQuestions);
      }

      return questions;
    }

    const mathQuestions = await fetchQuestions(MathQuestion, areaSizes.math, excludedIds);
    const grammarQuestions = await fetchQuestions(GrammarQuestion, areaSizes.grammar, excludedIds);
    const calcQuestions = await fetchQuestions(CalcQuestion, areaSizes.calc, excludedIds);
    const readingQuestions = await fetchQuestions(ReadingQuestion, areaSizes.reading, excludedIds);

    function isAreaKey(key: any): key is AreaKey {
      return key in modelMap;
    }

    let fifthQuestion = [];
    if (isAreaKey(area)) {
      fifthQuestion = await fetchQuestions(modelMap[area], 1, excludedIds);
    }

    const questions = [...mathQuestions, ...readingQuestions, ...calcQuestions, ...grammarQuestions, ...fifthQuestion];

    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching questions' });
  }
});

app.get('/five-act', async (req, res) => {
  try {
    const { excludedIdString, area: areaQuery } = req.query;
    const area = typeof areaQuery === 'string' && areaQuery.trim() !== '' ? areaQuery : 'math';
    type AreaKey = 'math' | 'reading' | 'science' | 'english';

    let excludedIds: string[] = [];
    if (typeof excludedIdString === 'string') {
      excludedIds = excludedIdString.split(',');
    }

    const areaSizes = { math: 1, reading: 1, science: 1, english: 1 };
    const modelMap = {
      math: MathQuestion,
      reading: ReadingQuestion,
      science: ScienceQuestion,
      english: GrammarQuestion
    };

    async function fetchQuestions(model: any, size: any, excludedIds: any) {
      let questions = await model.aggregate([
        { $match: { _id: { $nin: excludedIds } } },
        { $sample: { size } }
      ]);

      // If there aren't enough new questions, fetch the shortfall from the excluded ones
      if (questions.length < size) {
        const shortfall = size - questions.length;
        const fallbackQuestions = await model.aggregate([
          { $match: { _id: { $in: excludedIds } } }, // Note the $in operator to select from excludedIds
          { $sample: { size: shortfall } }
        ]);
        questions = questions.concat(fallbackQuestions);
      }

      return questions;
    }

    const mathQuestions = await fetchQuestions(MathQuestion, areaSizes.math, excludedIds);
    const grammarQuestions = await fetchQuestions(GrammarQuestion, areaSizes.english, excludedIds);
    const scienceQuestions = await fetchQuestions(ScienceQuestion, areaSizes.science, excludedIds);
    const readingQuestions = await fetchQuestions(ReadingQuestion, areaSizes.reading, excludedIds);

    function isAreaKey(key: any): key is AreaKey {
      return key in modelMap;
    }

    let fifthQuestion = [];
    if (isAreaKey(area)) {
      fifthQuestion = await fetchQuestions(modelMap[area], 1, excludedIds);
    }

    const questions = [...mathQuestions, ...readingQuestions, ...scienceQuestions, ...grammarQuestions, ...fifthQuestion];

    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching questions' });
  }
});

app.post('/submit-info', async (req, res) => {
  const { email, choseSAT, satScores, satWeightage, actScores, actWeightage, firstBetaButton, log } = req.body;

  // Process and save the data to your database
  // For example, saving to a 'DemoUserInfo' collection
  const userInfo = new DemoUser({
      email,
      choseSAT,
      satScores,
      satWeightage,
      actScores,
      actWeightage,
      firstBetaButton,
      log
  });

  try {
      const existingUser = await DemoUser.findOne({ email: email });

      if (existingUser) {
        // User already exists, so don't add or send an email
        res.status(409).send({ message: "User already exists" });
        return;
      }

      await userInfo.save();
      res.status(201).send({ message: "Info submitted successfully" });

      const mailOptions = {
          from: 'scholarsbeacon@gmail.com',
          to: email,
          subject: 'SAT/ACT Prep',
          html: `
              <p>Hey!</p>
              <p>Thank you for registering.</p>
              <p>Great job completing the questions. You have successfully earned a spot on our early access list to be the first to know when we launch. The founders would love to chat with you, hear your thoughts, and share more about our story. If you’d be interested, fill out this
              <a href="https://forms.gle/uqQNTUUFrxDNVs756" style="color: blue; text-decoration: none;">google form</a>.</p>
              <p>SB Team</p>
          `
      };

      transporter.sendMail(mailOptions, function(error, info){
          if (error) {
              console.log(error);
              return res.status(500).json({ message: 'Error sending email' });
          } else {
              console.log('Email sent: ' + info.response);
              res.json({ message: 'Email submitted successfully'});
              return;
          }
      });
    } catch (error) {
        res.status(400).send(error);
    }
});


app.post('/submit-email', async (req, res) => {
  const { email } = req.body;

  if (!email) {
      return res.status(400).json({ message: 'Email is required' });
  }

  try {
      const existingUser = await UserEmail.findOne({ email: email });

      if (existingUser) {
        // Email already exists in the database, so don't re-add or resend email
        res.status(409).send({ message: "Email already registered" });
        return;
      }
      // Save the email in the database
      const newUser = new UserEmail({ email });
      await newUser.save();

      // Count the number of users registered before this one
      const userNumber = await UserEmail.countDocuments({ createdAt: { $lt: newUser.createdAt } });

      // Send a default email to the user
      const mailOptions = {
          from: 'scholarsbeacon@gmail.com',
          to: email,
          subject: 'SAT/ACT Prep',
          html: `
              <p>Hi</p>
              <p>Thank you for registering. Your registration number is ${userNumber + 1}.</p>
              <p>You have successfully signed up to be among the first to know when we launch. I hope you now understand why our mission is so important. If you’d like to chat with the founders to ask questions or hear more about our story, fill out this
              <a href="https://forms.gle/uqQNTUUFrxDNVs756" style="color: blue; text-decoration: none;">google form</a>.</p>
              <p>SB Team</p>
          `
      };

      transporter.sendMail(mailOptions, function(error, info){
          if (error) {
              console.log(error);
              return res.status(500).json({ message: 'Error sending email' });
          } else {
              console.log('Email sent: ' + info.response);
              res.json({ message: 'Email submitted successfully', userNumber: userNumber + 1 });
              return;
          }
      });
  } catch (error) {
      console.error('Error in /submit-email route:', error);
      res.status(500).json({ message: 'Error processing your request' });
  }
  return;
});

app.post('/submit-referral', async (req, res) => {
  const { email } = req.body;

  if (!email) {
      return res.status(400).json({ message: 'Email is required' });
  }

  try {
      const existingUser = await UserEmail.findOne({ email: email });

      if (existingUser) {
        // Email already exists in the database, so don't re-add or resend email
        res.status(409).send({ message: "Email already registered" });
        return;
      }
      // Save the email in the database
      const newUser = new UserEmail({ email });
      await newUser.save();

      // Count the number of users registered before this one
      const userNumber = await UserEmail.countDocuments({ createdAt: { $lt: newUser.createdAt } });

      // Send a default email to the user
      const mailOptions = {
          from: 'scholarsbeacon@gmail.com',
          to: email,
          subject: 'SAT/ACT Prep',
          html: `
              <p>Hey!</p>
              <p>Your friend has referred you to try out the beta version of our revolutionary SAT & ACT prep platform. We are making test prep simple, engaging, and effective.</p>
              <p>You can try it here:
              <a href="https://www.scholarsbeacon.net" style="color: blue; text-decoration: none;">https://www.scholarsbeacon.net</a>. Complete the beta for early access to our full version coming out in April.</p>
              <p>Afterwards, If you’d like to chat with the founders to ask questions or hear more about our story, fill out this 
              <a href="https://forms.gle/uqQNTUUFrxDNVs756" style="color: blue; text-decoration: none;">google form</a>.</p>
              <p>SB Team</p>
          `
      };

      transporter.sendMail(mailOptions, function(error, info){
          if (error) {
              console.log(error);
              return res.status(500).json({ message: 'Error sending email' });
          } else {
              console.log('Email sent: ' + info.response);
              res.json({ message: 'Email submitted successfully', userNumber: userNumber + 1 });
              return;
          }
      });
  } catch (error) {
      console.error('Error in /submit-email route:', error);
      res.status(500).json({ message: 'Error processing your request' });
  }
  return;
});

app.post('/submit-feedback', async (req, res) => {
  const { email, personType, name, location, message } = req.body;

  if (!email) {
      return res.status(400).json({ message: 'Email is required' });
  }

  try {
      // const existingUser = await UserEmail.findOne({ email: email });

      // if (existingUser) {
      //   // Email already exists in the database, so don't re-add or resend email
      //   res.status(409).send({ message: "Email already registered" });
      //   return;
      // }
      // Save the email in the database
      const newFeedback = new UserFeedback({ email, personType, name, location, message });
      await newFeedback.save();
  } catch (error) {
      console.error('Error in /submit-feedback route:', error);
      res.status(500).json({ message: 'Error processing your request' });
  }
  return;
});

app.post('/auth/google', async (req: express.Request, res: express.Response) => {
  const { token }  = req.body;
  const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID, 
  });
  const payload = ticket.getPayload();
  const userid = payload!['sub'];

  User.findOne({ googleId: userid }).then((currentUser: UserDocument | null) => {
    if(currentUser){
      // already have the user
      req.session.user = currentUser;
      res.json(currentUser);
    } else {
      // if not, create user in our db
      console.log(payload!.picture)
      new User({
        googleId: userid,
        username: payload!.name,
        email: payload!.email,
        photo: payload!.picture,
        // add other attributes 
      }).save().then((newUser: UserDocument) => {
        req.session.user = newUser;
        res.json(newUser);
      });
    }
  });
});

app.post('/api/add-questions/:type', async (req, res) => {
  const { type } = req.params; // Extract the type from the URL

  let questionModel;
  switch (type.toLowerCase()) {
    case 'calc':
      questionModel = CalcQuestion;
      break;
    case 'math':
      questionModel = MathQuestion; // Assuming MathQuestion is your model for Math questions
      break;
    case 'reading':
      questionModel = ReadingQuestion; // And so on for other types
      break;
    case 'grammar':
      questionModel = GrammarQuestion;
      break;
    case 'science':
      questionModel = ScienceQuestion;
      break;
    default:
      return res.status(400).json({ message: 'Invalid question type provided' });
  }

  console.log(questionModel.modelName); // Should log the model name like 'MathQuestion'
  console.log(questionModel.collection.name); // Should log the intended collection name like 'mathQuestions'


  const question = new questionModel(req.body); // Use the determined model to create a new question
  await question.save();
  res.json({ message: 'Question added successfully!' });
  return;
});


app.get('/api/questions', async (req, res) => {
  const { page, limit } = req.query;
  const pageInt = parseInt(page as string) || 1;
  const limitInt = parseInt(limit as string) || 10;

  try {
    const questions = await Question.find()
      .skip((pageInt - 1) * limitInt)
      .limit(limitInt);

    const totalQuestions = await Question.countDocuments();

    res.json({
      questions,
      totalPages: Math.ceil(totalQuestions / limitInt),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching questions' });
  }
});


app.get('/api/questions/:id', async (req, res) => {
  const question = await Question.findById(req.params.id);
  res.json(question);
});

app.get('/auth/current_user', (req, res) => {
  if (req.session.user) {
    res.json(req.session.user);
  } else {
    res.status(401).json({ message: 'Not logged in' });
  }
});

app.get('/api/user/:userId?/questions', async (req, res) => {
  const { userId } = req.params;
  const { page, limit } = req.query;
  const pageInt = parseInt(page as string) || 1;
  const limitInt = parseInt(limit as string) || 10;

  try {
    let completedQuestionIds: any[] = [];
    if (userId) {
      // Fetch the user's analytics document if userId is provided
      const analytics = await UserAnalytics.findOne({ userId });

      // Get the list of completed question IDs
      completedQuestionIds = analytics ? analytics.completedQuestions.map(q => q.questionId.toString()) : [];
    }

    // Fetch paginated questions
    const questions = await Question.find()
      .skip((pageInt - 1) * limitInt)
      .limit(limitInt)
      .lean();

    // Add the completed field to each question if userId is provided
    const questionsWithCompletionStatus = questions.map(question => ({
      ...question,
      completed: userId ? completedQuestionIds.includes(question._id.toString()) : false,
    }));

    const totalQuestions = await Question.countDocuments();

    res.json({
      questions: questionsWithCompletionStatus,
      totalPages: Math.ceil(totalQuestions / limitInt),
      currentPage: pageInt
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching questions.' });
  }
});



app.post('/api/submit-answer', async (req, res) => {
  const { userId, questionId, isCorrect, isUnderstood } = req.body;

  const question = await Question.findById(questionId);

  if (!question) {
    res.status(404).json({ error: 'Question not found.' });
    return;
  }

  try {
    // Fetch the user's analytics document
    let analytics = await UserAnalytics.findOne({ userId });

    // Create a new UserAnalytics entry if it doesn't exist
    // Move this logic to account creation later
    if (!analytics) {
      analytics = new UserAnalytics({
        userId,
        totalQuestionsAnswered: 0,
        totalCorrectAnswers: 0,
        categoryPerformance: [],
        difficultyPerformance: [],
        completedQuestions: [],
      });
    }

    const isAlreadyAnswered = analytics.completedQuestions.some(q => q.questionId.toString() === questionId.toString());

    if (!isAlreadyAnswered) {
      analytics.totalQuestionsAnswered += 1;
      if (isCorrect) {
        analytics.totalCorrectAnswers += 1;
      }

      let categoryStat = analytics.categoryPerformance.find(cp => cp.category === question.category);
      if (!categoryStat) {
        categoryStat = { category: question.category, totalQuestions: 0, correctAnswers: 0 };
        analytics.categoryPerformance.push(categoryStat);
      }
      categoryStat.totalQuestions += 1;
      if (isCorrect) {
        categoryStat.correctAnswers += 1;
      }

      let difficultyStat = analytics.difficultyPerformance.find(dp => dp.difficulty === question.difficulty);
      if (!difficultyStat) {
        difficultyStat = { difficulty: question.difficulty, totalQuestions: 0, correctAnswers: 0 };
        analytics.difficultyPerformance.push(difficultyStat);
      }
      difficultyStat.totalQuestions += 1;
      if (isCorrect) {
        difficultyStat.correctAnswers += 1;
      }

      analytics.completedQuestions.push({ questionId, isCorrect, isUnderstood });

      await analytics.save();
    }

    res.json({ message: 'User analytics updated successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while updating user analytics.' });
  }
});




// Get all posts
app.get('/api/posts', async (req, res) => {
  const posts = await Post.find().populate('user', 'username email photo'); // populate user to get user details
  res.json(posts);
});

// Get a specific post
app.get('/api/posts/:id', async (req, res) => {
  const post = await Post.findById(req.params.id).populate('user', 'username email photo');
  res.json(post);
});

// Create a new post
app.post('/api/posts', async (req, res) => { // Ensure authenticated in future
  // Assuming that the Post model includes 'createdBy' and 'createdAt' properties
  const post = new Post({
    title: req.body.title,
    content: req.body.content,
    // user: req.session.user!._id, // Check if user exists in the future
    created_by: req.body.created_by,
    created_at: req.body.created_at,
  });
  const saved = await post.save();
  res.json({ message: 'Post created successfully!' , id: saved._id});
});

app.post('/api/posts/:id/comments', async (req, res) => { // Ensure authenticated in future
  const post = await Post.findById(req.params.id);
  if (post) {
    const comment = {
      text: req.body.text,
      created_by: req.body.created_by, // Check if user exists in the future
    };
    post.comments.push(comment);
    await post.save();
    res.json({ message: 'Comment added successfully!' });
  } else {
    res.status(404).json({ message: 'Post not found.' });
  }
});

const port = process.env.PORT || '5000';

app.listen(port, () => console.log(`Server started on port ${port}`));
