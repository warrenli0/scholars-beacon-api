import { Router } from 'express';
import { getAllModules, getModuleById, createModule } from '../controllers/moduleController.js';

const router = Router();

router.get('/modules', getAllModules);
router.get('/modules/:id', getModuleById);
router.post('/add-module', createModule);

export default router;
