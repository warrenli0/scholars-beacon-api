// controllers/betaPageController.ts

import { Request, Response } from 'express';
import MathQuestion from '../models/MathQuestion.js';
import ReadingQuestion from '../models/ReadingQuestion.js';
import CalcQuestion from '../models/CalcQuestion.js';
import GrammarQuestion from '../models/GrammarQuestion.js';
import ScienceQuestion from '../models/ScienceQuestion.js';
import DemoUser from '../models/DemoUser.js';
import UserEmail from '../models/UserEmail.js';
import UserFeedback from '../models/UserFeedback.js';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'scholarsbeacon@gmail.com',
        pass: 'qvmu drpu pyvw lxvw'
    }
  });

type AreaKeySAT = 'math' | 'reading' | 'calc' | 'grammar';
type AreaKeyACT = 'math' | 'reading' | 'science' | 'english';

const fetchQuestions = async (model: any, size: any, excludedIds: any) => {
  let questions = await model.aggregate([
    { $match: { _id: { $nin: excludedIds } } },
    { $sample: { size } }
  ]);

  if (questions.length < size) {
    const shortfall = size - questions.length;
    const fallbackQuestions = await model.aggregate([
      { $match: { _id: { $in: excludedIds } } },
      { $sample: { size: shortfall } }
    ]);
    questions = questions.concat(fallbackQuestions);
  }

  return questions;
};

export const getFiveSat = async (req: Request, res: Response) => {
  try {
    const { excludedIdString, area: areaQuery } = req.query;
    const area = typeof areaQuery === 'string' && areaQuery.trim() !== '' ? areaQuery : 'math';

    let excludedIds: string[] = [];
    if (typeof excludedIdString === 'string') {
      excludedIds = excludedIdString.split(',');
    }

    const areaSizes = { math: 1, reading: 1, calc: 1, grammar: 1 };
    const modelMap = {
      math: MathQuestion,
      reading: ReadingQuestion,
      calc: CalcQuestion,
      grammar: GrammarQuestion
    };

    const mathQuestions = await fetchQuestions(MathQuestion, areaSizes.math, excludedIds);
    const grammarQuestions = await fetchQuestions(GrammarQuestion, areaSizes.grammar, excludedIds);
    const calcQuestions = await fetchQuestions(CalcQuestion, areaSizes.calc, excludedIds);
    const readingQuestions = await fetchQuestions(ReadingQuestion, areaSizes.reading, excludedIds);

    function isAreaKey(key: any): key is AreaKeySAT {
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
};

export const getFiveAct = async (req: Request, res: Response) => {
  try {
    const { excludedIdString, area: areaQuery } = req.query;
    const area = typeof areaQuery === 'string' && areaQuery.trim() !== '' ? areaQuery : 'math';

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

    const mathQuestions = await fetchQuestions(MathQuestion, areaSizes.math, excludedIds);
    const grammarQuestions = await fetchQuestions(GrammarQuestion, areaSizes.english, excludedIds);
    const scienceQuestions = await fetchQuestions(ScienceQuestion, areaSizes.science, excludedIds);
    const readingQuestions = await fetchQuestions(ReadingQuestion, areaSizes.reading, excludedIds);

    function isAreaKey(key: any): key is AreaKeyACT {
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
};

export const submitInfo = async (req: Request, res: Response) => {
  const { email, choseSAT, satScores, satWeightage, actScores, actWeightage, firstBetaButton, log } = req.body;

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

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
        return res.status(500).json({ message: 'Error sending email' });
      } else {
        console.log('Email sent: ' + info.response);
        res.json({ message: 'Email submitted successfully' });
        return;
      }
    });
  } catch (error) {
    res.status(400).send(error);
  }
};

export const submitEmail = async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ message: 'Email is required' });
    return;
  }

  try {
    const existingUser = await UserEmail.findOne({ email: email });

    if (existingUser) {
      res.status(409).send({ message: "Email already registered" });
      return;
    }

    const newUser = new UserEmail({ email });
    await newUser.save();

    const userNumber = await UserEmail.countDocuments({ createdAt: { $lt: newUser.createdAt } });

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

    transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
      res.status(500).json({ message: 'Error sending email' });
    } else {
      console.log('Email sent: ' + info.response);
      res.json({ message: 'Email submitted successfully', userNumber: userNumber + 1 });
    }
    });
  } catch (error) {
    console.error('Error in /submit-email route:', error);
    res.status(500).json({ message: 'Error processing your request' });
  }
};

export const submitReferral = async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ message: 'Email is required' });
    return;
  }

  try {
    const existingUser = await UserEmail.findOne({ email: email });

    if (existingUser) {
      res.status(409).send({ message: "Email already registered" });
      return;
    }

    const newUser = new UserEmail({ email });
    await newUser.save();

    const userNumber = await UserEmail.countDocuments({ createdAt: { $lt: newUser.createdAt } });

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

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
        res.status(500).json({ message: 'Error sending email' });
      } else {
        console.log('Email sent: ' + info.response);
        res.json({ message: 'Email submitted successfully', userNumber: userNumber + 1 });
      }
    });
  } catch (error) {
    console.error('Error in /submit-email route:', error);
    res.status(500).json({ message: 'Error processing your request' });
  }
};

export const submitFeedback = async (req: Request, res: Response) => {
  const { email, personType, name, location, message } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const newFeedback = new UserFeedback({ email, personType, name, location, message });
    await newFeedback.save();
    return res.json({ message: 'Feedback submitted successfully'});
  } catch (error) {
    console.error('Error in /submit-feedback route:', error);
    return res.status(500).json({ message: 'Error processing your request' });
  }
};
