import { getInstagramProvider } from "../providers/instagram/index.js";
import { sendSuccess } from "../utils/response.js";
import {
    validateActionBody,
    validateCommentReplyBody,
    validateId,
    validateIdentifier,
    validateLinkQuery,
    validateMessageBody,
    validatePagination,
    validatePublishBody,
} from "../utils/validation.js";

function meta(req, provider, extra = {}) {
    return {
        requestId: req.id,
        provider: provider.status(),
        ...extra,
    };
}

export function accountController() {
    return async (req, res) => {
        const provider = getInstagramProvider();
        const identifier = validateIdentifier(req.params.identifier);
        const data = await provider.getAccount(identifier.value);
        return sendSuccess(res, data, { meta: meta(req, provider, { identifier }) });
    };
}

export function profileController() {
    return async (req, res) => {
        const provider = getInstagramProvider();
        const identifier = validateIdentifier(req.params.identifier);
        const data = await provider.getProfile(identifier.value);
        return sendSuccess(res, data, { meta: meta(req, provider, { identifier }) });
    };
}

export function profileByLinkController() {
    return async (req, res) => {
        const provider = getInstagramProvider();
        const parsedLink = validateLinkQuery(req.query, { allowProfile: true });
        const data = await provider.getProfileByLink(parsedLink);
        return sendSuccess(res, data, { meta: meta(req, provider, { link: parsedLink }) });
    };
}

export function relationController(resource) {
    return async (req, res) => {
        const provider = getInstagramProvider();
        const identifier = validateIdentifier(req.params.identifier);
        const query = validatePagination(req.query);
        const data =
            resource === "followers"
                ? await provider.getFollowers(identifier.value, query)
                : await provider.getFollowing(identifier.value, query);
        return sendSuccess(res, data, { meta: meta(req, provider, { identifier, pagination: query }) });
    };
}

export function actionController(action) {
    return async (req, res) => {
        const provider = getInstagramProvider();
        const identifier = validateIdentifier(req.params.identifier);
        const body = validateActionBody(req.body);
        const data = await provider.performAction(action, identifier.value, body);
        return sendSuccess(res, data, { statusCode: 202, meta: meta(req, provider, { identifier, dryRun: true }) });
    };
}

export function userCollectionController(resource) {
    return async (req, res) => {
        const provider = getInstagramProvider();
        const identifier = validateIdentifier(req.params.identifier);
        const query = validatePagination(req.query);
        const data = await provider.getUserCollection(resource, identifier.value, query);
        return sendSuccess(res, data, { meta: meta(req, provider, { identifier, pagination: query }) });
    };
}

export function linkCollectionController(resource) {
    return async (req, res) => {
        const provider = getInstagramProvider();
        const parsedLink = validateLinkQuery(req.query, { allowStories: true });
        const data = await provider.getByLink(resource, parsedLink);
        return sendSuccess(res, data, { meta: meta(req, provider, { link: parsedLink }) });
    };
}

export function postDetailController() {
    return async (req, res) => {
        const provider = getInstagramProvider();
        const id = validateId(req.params.id);
        const data = await provider.getPostById(id);
        return sendSuccess(res, data, { meta: meta(req, provider, { id }) });
    };
}

export function publishController(resource) {
    return async (req, res) => {
        const provider = getInstagramProvider();
        const body = validatePublishBody(req.body);
        const data = await provider.publish(resource, body);
        return sendSuccess(res, data, { statusCode: 202, meta: meta(req, provider, { dryRun: true }) });
    };
}

export function commentsController() {
    return async (req, res) => {
        const provider = getInstagramProvider();
        const query = validatePagination(req.query);
        const parsedLink = req.query.link || req.query.url ? validateLinkQuery(req.query) : null;
        const data = await provider.getComments({ ...query, link: parsedLink?.url ?? null });
        return sendSuccess(res, data, { meta: meta(req, provider, { pagination: query, link: parsedLink }) });
    };
}

export function replyCommentController({ routeId = true } = {}) {
    return async (req, res) => {
        const provider = getInstagramProvider();
        const body = validateCommentReplyBody(req.body);
        const id = routeId ? validateId(req.params.id) : body.id;
        const data = await provider.replyComment(id, body);
        return sendSuccess(res, data, { statusCode: 202, meta: meta(req, provider, { id, dryRun: true }) });
    };
}

export function mentionsController() {
    return async (req, res) => {
        const provider = getInstagramProvider();
        const query = validatePagination(req.query);
        const data = await provider.getMentions(query);
        return sendSuccess(res, data, { meta: meta(req, provider, { pagination: query }) });
    };
}

export function hashtagMediaController() {
    return async (req, res) => {
        const provider = getInstagramProvider();
        const query = { ...validatePagination(req.query), hashtag: req.query.hashtag || req.query.tag || "tenrusl" };
        const data = await provider.getHashtagMedia(query);
        return sendSuccess(res, data, { meta: meta(req, provider, { pagination: query }) });
    };
}

export function insightsController() {
    return async (req, res) => {
        const provider = getInstagramProvider();
        const data = await provider.getInsights(req.query);
        return sendSuccess(res, data, { meta: meta(req, provider) });
    };
}

export function conversationsController() {
    return async (req, res) => {
        const provider = getInstagramProvider();
        const query = validatePagination(req.query);
        const data = await provider.getConversations(query);
        return sendSuccess(res, data, { meta: meta(req, provider, { pagination: query }) });
    };
}

export function messagesController() {
    return async (req, res) => {
        const provider = getInstagramProvider();
        const query = validatePagination(req.query);
        const data = await provider.getMessages(query);
        return sendSuccess(res, data, { meta: meta(req, provider, { pagination: query }) });
    };
}

export function messageThreadController() {
    return async (req, res) => {
        const provider = getInstagramProvider();
        const id = validateId(req.params.id);
        const query = validatePagination(req.query);
        const data = await provider.getMessageThread(id, query);
        return sendSuccess(res, data, { meta: meta(req, provider, { id, pagination: query }) });
    };
}

export function sendMessageController() {
    return async (req, res) => {
        const provider = getInstagramProvider();
        const id = validateId(req.params.id);
        const body = validateMessageBody(req.body);
        const data = await provider.sendMessage(id, body);
        return sendSuccess(res, data, { statusCode: 202, meta: meta(req, provider, { id, dryRun: true }) });
    };
}
