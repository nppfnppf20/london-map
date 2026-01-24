import { Router } from 'express';
import * as geocoderController from '../controllers/geocoder.js';

const router = Router();

router.get('/search', geocoderController.search);
router.post('/batch', geocoderController.batch);

export default router;
