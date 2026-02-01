import { Router } from 'express';
import multer from 'multer';
import * as placesController from '../controllers/places.js';
import { uploadPlaceAudio } from '../controllers/audio.js';

const router = Router();
const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 25 * 1024 * 1024 }
});

router.get('/', placesController.getAll);
router.get('/:id', placesController.getById);
router.post('/', placesController.create);
router.put('/:id', placesController.update);
router.post('/:id/collections', placesController.addCollections);
router.post('/:id/audio', upload.single('audio'), uploadPlaceAudio);
router.delete('/:id', placesController.remove);

export default router;
