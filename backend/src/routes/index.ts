import { Router } from 'express';
import placesRoutes from './places.js';
import geocoderRoutes from './geocoder.js';

const router = Router();

router.use('/places', placesRoutes);
router.use('/geocode', geocoderRoutes);

// Health check
router.get('/health', (req, res) => {
	res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
