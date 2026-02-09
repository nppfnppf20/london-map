import { Router } from 'express';
import * as shareLinksController from '../controllers/share-links.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/', requireAuth, shareLinksController.create);
router.get('/', requireAuth, shareLinksController.getAll);
router.get('/:token', shareLinksController.resolve);
router.delete('/:id', requireAuth, shareLinksController.remove);

export default router;
