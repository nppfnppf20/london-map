import { Router } from 'express';
import multer from 'multer';
import * as placesController from '../controllers/places.js';
import * as placeImagesController from '../controllers/place-images.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const router = Router();

router.get('/', placesController.getAll);
router.get('/nearby', placesController.getNearby);
router.post('/along-route', placesController.getAlongRoute);
router.get('/:id', placesController.getById);
router.post('/', placesController.create);
router.put('/:id', placesController.update);
router.post('/:id/collections', placesController.addCollections);
router.delete('/:id', placesController.remove);

// Place images
router.get('/:id/images', placeImagesController.getImages);
router.post('/:id/images', upload.single('image'), placeImagesController.addImage);
router.put('/images/:imageId', placeImagesController.updateSortOrder);
router.delete('/images/:imageId', placeImagesController.deleteImage);

export default router;
