import { validateInstagramRequest } from '../validators/instagram.validator.js';
import { getInstagramFeed } from '../services/instagram.service.js';
import { sendSuccess } from '../utils/response.js';

export async function getInstagramFeedController(req, res) {
  const input = validateInstagramRequest(req.params, req.query);
  const result = await getInstagramFeed(input);
  return sendSuccess(res, result);
}
