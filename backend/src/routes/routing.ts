import { Router } from 'express';
import { handleGetDirections, handleGetMultiStopRoute } from '../controllers/routing.js';

const router = Router();

// Get directions between two points
router.post('/directions', handleGetDirections);

// Get route through multiple waypoints
router.post('/multi-stop', handleGetMultiStopRoute);

export default router;
