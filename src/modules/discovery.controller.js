import { sendSuccess } from "../utils/response.js";
import { validateHashtagQuery, validatePagination } from "../utils/validation.js";
import { getProviderContext } from "./controller.helpers.js";

export function mentionsController() {
    return async (req, res) => {
        const query = validatePagination(req.query);
        const { provider, meta } = getProviderContext(req, { pagination: query });
        const data = await provider.getMentions(query);
        return sendSuccess(res, data, { meta });
    };
}

export function hashtagMediaController() {
    return async (req, res) => {
        const query = validateHashtagQuery(req.query);
        const { provider, meta } = getProviderContext(req, { pagination: query });
        const data = await provider.getHashtagMedia(query);
        return sendSuccess(res, data, { meta });
    };
}
