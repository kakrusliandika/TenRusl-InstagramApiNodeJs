import { Router } from 'express';
import { apiKeyMiddleware } from '../middlewares/api-key.middleware.js';
import { publicApiLimiter } from '../middlewares/rate-limit.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';
import {
  actionController,
  detailByIdController,
  listResourceController,
  postByIdController,
  postByLinkController,
  selfCollectionController,
  usernameCollectionController
} from '../controllers/v1.controller.js';

export const v1Router = Router();

v1Router.use(publicApiLimiter, apiKeyMiddleware);

v1Router.get('/accounts', asyncHandler(listResourceController('accounts')));
v1Router.get('/accounts/:id', asyncHandler(detailByIdController('accounts')));

v1Router.get('/profiles', asyncHandler(listResourceController('profiles')));
v1Router.get('/profiles/:id', asyncHandler(detailByIdController('profiles')));

v1Router.get('/followers/self', asyncHandler(selfCollectionController('followers')));
v1Router.get('/followers/users/:username', asyncHandler(usernameCollectionController('followers')));
v1Router.get('/following/self', asyncHandler(selfCollectionController('following')));
v1Router.get('/following/users/:username', asyncHandler(usernameCollectionController('following')));

v1Router.post('/actions/follow/from-username', asyncHandler(actionController('follow-from-username')));
v1Router.post('/actions/unfollow/from-username', asyncHandler(actionController('unfollow-from-username')));

v1Router.get('/photos/users/:username', asyncHandler(usernameCollectionController('photos')));
v1Router.get('/feeds/users/:username', asyncHandler(usernameCollectionController('feeds')));
v1Router.get('/statuses/users/:username', asyncHandler(usernameCollectionController('statuses')));

v1Router.get('/posts/by-link', asyncHandler(postByLinkController));
v1Router.get('/posts', asyncHandler(listResourceController('posts')));
v1Router.get('/posts/:id', asyncHandler(postByIdController));

v1Router.get('/reels', asyncHandler(listResourceController('reels')));
v1Router.get('/media', asyncHandler(listResourceController('media')));
v1Router.post('/publish/media', asyncHandler(actionController('publish-media')));
v1Router.post('/publish/reel', asyncHandler(actionController('publish-reel')));

v1Router.get('/comments', asyncHandler(listResourceController('comments')));
v1Router.post('/comments/:id/reply', asyncHandler(actionController('reply-comment')));

v1Router.get('/mentions', asyncHandler(listResourceController('mentions')));
v1Router.get('/hashtags/media', asyncHandler(listResourceController('hashtag-media')));
v1Router.get('/insights', asyncHandler(listResourceController('insights')));
v1Router.get('/conversations', asyncHandler(listResourceController('conversations')));
v1Router.get('/messages', asyncHandler(listResourceController('messages')));
v1Router.post('/messages/send', asyncHandler(actionController('send-message')));
