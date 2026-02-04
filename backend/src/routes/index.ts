import { Router } from 'express';
import placesRoutes from './places.js';
import geocoderRoutes from './geocoder.js';
import collectionsRoutes from './collections.js';
import routingRoutes from './routing.js';

const router = Router();

router.use('/places', placesRoutes);
router.use('/collections', collectionsRoutes);
router.use('/geocode', geocoderRoutes);
router.use('/routing', routingRoutes);

// Health check
router.get('/health', (req, res) => {
	res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
