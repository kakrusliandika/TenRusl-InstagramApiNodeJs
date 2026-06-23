import { sendSuccess } from "../utils/response.js";
import { validateActionBody, validateIdentifier, validatePagination } from "../utils/validation.js";
import { getProviderContext } from "./controller.helpers.js";

export function relationController(resource) {
    return async (req, res) => {
        const identifier = validateIdentifier(req.params.identifier);
        const query = validatePagination(req.query);
        const { provider, meta } = getProviderContext(req, { identifier, pagination: query });
        const data =
            resource === "followers"
                ? await provider.getFollowers(identifier.value, query)
                : await provider.getFollowing(identifier.value, query);
        return sendSuccess(res, data, { meta });
    };
}

export function actionController(action) {
    return async (req, res) => {
        const identifier = validateIdentifier(req.params.identifier);
        const body = validateActionBody(req.body);
        const { provider, meta } = getProviderContext(req, { identifier, dryRun: true });
        const data = await provider.performAction(action, identifier.value, body);
        return sendSuccess(res, data, { statusCode: 202, meta });
    };
}
