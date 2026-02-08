import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as profilesController from '../controllers/profiles.js';

const router = Router();

router.get('/me', requireAuth, profilesController.getMyProfile);
router.put('/me', requireAuth, profilesController.updateMyProfile);

export default router;
