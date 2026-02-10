import { Router } from 'express';
import * as beaconsController from '../controllers/beacons.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

router.post('/', optionalAuth, beaconsController.create);
router.get('/:token', beaconsController.resolve);
router.post('/:token/join', beaconsController.join);
router.post('/:token/midpoint', beaconsController.midpoint);

export default router;
