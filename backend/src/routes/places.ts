import { Router } from 'express';
import * as placesController from '../controllers/places.js';

const router = Router();

router.get('/', placesController.getAll);
router.get('/nearby', placesController.getNearby);
router.post('/along-route', placesController.getAlongRoute);
router.get('/:id', placesController.getById);
router.post('/', placesController.create);
router.put('/:id', placesController.update);
router.post('/:id/collections', placesController.addCollections);
router.delete('/:id', placesController.remove);

export default router;
