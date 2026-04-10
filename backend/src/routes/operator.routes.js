import express from 'express';
import * as jobController from '../controllers/operator/job.controller.js';
import * as fuelController from '../controllers/operator/fuel.controller.js';
import * as profileController from '../controllers/operator/profile.controller.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(verifyToken);
router.use(requireRole(['operator']));

// Job execution routes
router.get('/jobs', jobController.getJobs);
router.get('/stats', jobController.getStats);
router.patch('/job-status/:id', jobController.updateStatus);

// Fuel telemetry routes
router.post('/fuel', fuelController.addFuelLog);
router.get('/fuel', fuelController.getFuelHistory);
router.get('/fuel/summary', fuelController.getFuelSummary);

// Profile routes
router.get('/profile', profileController.getProfile);
router.patch('/profile', profileController.updateProfile);
router.patch('/change-password', profileController.changePassword);
router.patch('/language', profileController.updateLanguage);

export default router;
