import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler.js';
import { sanitizeText } from '../utils/sanitize.js';
import {
  accountController,
  actionController,
  commentsController,
  conversationsController,
  hashtagMediaController,
  insightsController,
  linkCollectionController,
  mentionsController,
  messageThreadController,
  messagesController,
  postDetailController,
  profileByLinkController,
  profileController,
  publishController,
  relationController,
  replyCommentController,
  sendMessageController,
  userCollectionController
} from '../modules/gateway.controller.js';

export const v1Router = Router();

for (const paramName of ['identifier', 'id']) {
  v1Router.param(paramName, (req, _res, next, value, name) => {
    req.params[name] = sanitizeText(value, { maxLength: 128 });
    next();
  });
}

// Rute yang kompatibel dengan kontrak dari audit produksi.
v1Router.get('/get/accounts/:identifier', asyncHandler(accountController()));
v1Router.get('/get/profiles/by-link', asyncHandler(profileByLinkController()));
v1Router.get('/get/profiles/:identifier', asyncHandler(profileController()));

v1Router.get('/get/followers/:identifier', asyncHandler(relationController('followers')));
v1Router.get('/get/following/:identifier', asyncHandler(relationController('following')));

v1Router.post('/actions/follow/:identifier', asyncHandler(actionController('follow')));
v1Router.post('/actions/unfollow/:identifier', asyncHandler(actionController('unfollow')));

for (const resource of ['photos', 'feeds', 'statuses']) {
  v1Router.get(`/get/${resource}/by-link`, asyncHandler(linkCollectionController(resource)));
  v1Router.get(`/get/${resource}/users/:identifier`, asyncHandler(userCollectionController(resource)));
}

for (const resource of ['posts', 'reels', 'media']) {
  v1Router.get(`/get/${resource}/by-link`, asyncHandler(linkCollectionController(resource)));
  v1Router.get(`/get/${resource}/users/:identifier`, asyncHandler(userCollectionController(resource)));
}

v1Router.get('/get/posts/:id', asyncHandler(postDetailController()));

for (const resource of ['media', 'reels', 'photos', 'feeds', 'statuses']) {
  v1Router.post(`/publish/${resource}`, asyncHandler(publishController(resource)));
}

v1Router.get('/comments', asyncHandler(commentsController()));
v1Router.post('/comments/reply', asyncHandler(replyCommentController({ routeId: false })));
v1Router.post('/comments/:id/reply', asyncHandler(replyCommentController({ routeId: true })));

v1Router.get('/mentions', asyncHandler(mentionsController()));
v1Router.get('/hashtags/media', asyncHandler(hashtagMediaController()));
v1Router.get('/insights', asyncHandler(insightsController()));

v1Router.get('/conversations', asyncHandler(conversationsController()));
v1Router.get('/messages', asyncHandler(messagesController()));
v1Router.get('/messages/:id', asyncHandler(messageThreadController()));
v1Router.post('/messages/:id/send', asyncHandler(sendMessageController()));

// Alias kompatibilitas untuk gaya rute lama. Alias ini sengaja aman dan tetap menuju batas penyedia yang sama.
v1Router.get('/accounts/:identifier', asyncHandler(accountController()));
v1Router.get('/profiles/by-link', asyncHandler(profileByLinkController()));
v1Router.get('/profiles/:identifier', asyncHandler(profileController()));
v1Router.get('/followers/:identifier', asyncHandler(relationController('followers')));
v1Router.get('/following/:identifier', asyncHandler(relationController('following')));
v1Router.get('/posts/by-link', asyncHandler(linkCollectionController('posts')));
v1Router.get('/posts/:id', asyncHandler(postDetailController()));
