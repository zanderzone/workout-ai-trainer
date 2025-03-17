import { Router } from 'express';
import wodController from '../controllers/wod.controller';

const router = Router();

router.post('/wod', wodController.createWod);
router.get('/wod/:id', wodController.getWod);

export default router;