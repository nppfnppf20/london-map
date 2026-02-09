import { Router } from 'express';
import * as collectionsController from '../controllers/collections.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', collectionsController.getAll);
router.get('/:id', collectionsController.getById);
router.post('/', requireAuth, collectionsController.create);
router.put('/:id', requireAuth, collectionsController.update);
router.delete('/:id', requireAuth, collectionsController.remove);

export default router;
