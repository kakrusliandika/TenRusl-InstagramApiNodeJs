import { sendSuccess } from "../utils/response.js";
import { validateId, validateIdentifier, validateLinkQuery, validatePagination, validatePublishBody } from "../utils/validation.js";
import { getProviderContext } from "./controller.helpers.js";

export function userCollectionController(resource) {
    return async (req, res) => {
        const identifier = validateIdentifier(req.params.identifier);
        const query = validatePagination(req.query);
        const { provider, meta } = getProviderContext(req, { identifier, pagination: query });
        const data = await provider.getUserCollection(resource, identifier.value, query);
        return sendSuccess(res, data, { meta });
    };
}

export function linkCollectionController(resource) {
    return async (req, res) => {
        const parsedLink = validateLinkQuery(req.query, { allowStories: true });
        const { provider, meta } = getProviderContext(req, { link: parsedLink });
        const data = await provider.getByLink(resource, parsedLink);
        return sendSuccess(res, data, { meta });
    };
}

export function postDetailController() {
    return async (req, res) => {
        const id = validateId(req.params.id);
        const { provider, meta } = getProviderContext(req, { id });
        const data = await provider.getPostById(id);
        return sendSuccess(res, data, { meta });
    };
}

export function publishController(resource) {
    return async (req, res) => {
        const body = validatePublishBody(req.body);
        const { provider, meta } = getProviderContext(req, { dryRun: true });
        const data = await provider.publish(resource, body);
        return sendSuccess(res, data, { statusCode: 202, meta });
    };
}
