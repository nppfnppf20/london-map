import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as profilesController from '../controllers/profiles.js';
import * as likesController from '../controllers/likes.js';

const router = Router();

router.get('/me', requireAuth, profilesController.getMyProfile);
router.put('/me', requireAuth, profilesController.updateMyProfile);
router.get('/me/likes', requireAuth, likesController.getMyLikes);

export default router;
