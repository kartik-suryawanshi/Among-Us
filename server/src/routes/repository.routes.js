import { Router } from 'express';
import { validateRepoParams } from '../middleware/validateRepoParams.js';
import { getRepository, getLanguages } from '../controllers/repository.controller.js';

const router = Router();

// GET /api/repositories/:owner/:repo/languages AND /api/repos/:owner/:repo/languages
router.get('/:owner/:repo/languages', validateRepoParams, getLanguages);

// GET /api/repositories/:owner/:repo AND /api/repos/:owner/:repo
router.get('/:owner/:repo', validateRepoParams, getRepository);

export default router;
