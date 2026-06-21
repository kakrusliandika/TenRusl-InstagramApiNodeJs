import { Router } from 'express';
import { apiKeyMiddleware } from '../middlewares/api-key.middleware.js';
import { publicApiLimiter } from '../middlewares/rate-limit.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';
import { getInstagramFeedController } from '../controllers/instagram.controller.js';

export const instagramRouter = Router();

instagramRouter.get('/', publicApiLimiter, apiKeyMiddleware, asyncHandler(getInstagramFeedController));
instagramRouter.get('/:username', publicApiLimiter, apiKeyMiddleware, asyncHandler(getInstagramFeedController));
