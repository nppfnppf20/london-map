import { Router } from 'express';
import multer from 'multer';
import * as placesController from '../controllers/places.js';
import * as placeImagesController from '../controllers/place-images.js';
import * as commentsController from '../controllers/comments.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const router = Router();

router.get('/', optionalAuth, placesController.getAll);
router.get('/nearby', optionalAuth, placesController.getNearby);
router.post('/along-route', optionalAuth, placesController.getAlongRoute);
router.get('/:id', optionalAuth, placesController.getById);
router.post('/', requireAuth, placesController.create);
router.put('/:id', requireAuth, placesController.update);
router.post('/:id/collections', requireAuth, placesController.addCollections);
router.delete('/:id', requireAuth, placesController.remove);

// Place images
router.get('/:id/images', placeImagesController.getImages);
router.post('/:id/images', requireAuth, upload.single('image'), placeImagesController.addImage);
router.put('/images/:imageId', requireAuth, placeImagesController.updateSortOrder);
router.delete('/images/:imageId', requireAuth, placeImagesController.deleteImage);

// Comments
router.get('/:id/comments', optionalAuth, commentsController.getComments);
router.post('/:id/comments', requireAuth, commentsController.addComment);
router.delete('/comments/:id', requireAuth, commentsController.deleteComment);

export default router;
