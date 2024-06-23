import { Router } from 'express';
import {
  getFiveSat,
  getFiveAct,
  submitInfo,
  submitEmail,
  submitReferral,
  submitFeedback
} from '../controllers/betaPageController.js';

const router = Router();

router.get('/five-sat', getFiveSat);
router.get('/five-act', getFiveAct);
router.post('/submit-info', submitInfo);
router.post('/submit-email', submitEmail);
router.post('/submit-referral', submitReferral);
router.post('/submit-feedback', submitFeedback);

export default router;
