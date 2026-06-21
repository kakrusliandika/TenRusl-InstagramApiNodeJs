import { sendSuccess } from '../utils/response.js';
import {
  validateActionBody,
  validateCollectionQuery,
  validateIdParam,
  validatePostLink,
  validateUsernameParam
} from '../validators/v1.validator.js';
import {
  executeDryRunAction,
  getPostById,
  getPostByLink,
  getResourceById,
  getSelfCollection,
  getUserCollection,
  listResource
} from '../services/instagram-v1.service.js';

export function listResourceController(resource) {
  return async function listController(req, res) {
    const query = validateCollectionQuery(req.query);
    if (resource === 'posts' && query.link) {
      const link = validatePostLink(query.link);
      return sendSuccess(res, await getPostByLink(link));
    }
    return sendSuccess(res, await listResource(resource, query));
  };
}

export function detailByIdController(resource) {
  return async function detailController(req, res) {
    const id = validateIdParam(req.params);
    return sendSuccess(res, await getResourceById(resource, id));
  };
}

export function selfCollectionController(resource) {
  return async function selfController(req, res) {
    const query = validateCollectionQuery(req.query);
    return sendSuccess(res, await getSelfCollection(resource, query));
  };
}

export function usernameCollectionController(resource) {
  return async function usernameController(req, res) {
    const username = validateUsernameParam(req.params);
    const query = validateCollectionQuery(req.query);
    return sendSuccess(res, await getUserCollection(resource, username, query));
  };
}

export async function postByIdController(req, res) {
  const id = validateIdParam(req.params);
  return sendSuccess(res, await getPostById(id));
}

export async function postByLinkController(req, res) {
  const query = validateCollectionQuery(req.query);
  const link = validatePostLink(query.link);
  return sendSuccess(res, await getPostByLink(link));
}

export function actionController(action, statusCode = 202) {
  return async function actionHandler(req, res) {
    const body = validateActionBody(req.body);
    const params = req.params || {};
    return sendSuccess(res, await executeDryRunAction(action, body, params), statusCode);
  };
}
