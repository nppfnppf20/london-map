import { Router } from 'express';
import * as collectionsController from '../controllers/collections.js';

const router = Router();

router.get('/', collectionsController.getAll);
router.get('/:id', collectionsController.getById);
router.post('/', collectionsController.create);
router.put('/:id', collectionsController.update);
router.delete('/:id', collectionsController.remove);

export default router;
