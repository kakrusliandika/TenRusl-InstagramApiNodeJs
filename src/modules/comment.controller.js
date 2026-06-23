import { sendSuccess } from "../utils/response.js";
import { normalizeCommentReplyTarget } from "../utils/comment-target.js";
import { validateCommentReplyBody, validateLinkQuery, validatePagination } from "../utils/validation.js";
import { getProviderContext } from "./controller.helpers.js";

export function commentsController() {
    return async (req, res) => {
        const query = validatePagination(req.query);
        const parsedLink = req.query.link || req.query.url ? validateLinkQuery(req.query) : null;
        const { provider, meta } = getProviderContext(req, { pagination: query, link: parsedLink });
        const data = await provider.getComments({ ...query, link: parsedLink?.url ?? null });
        return sendSuccess(res, data, { meta });
    };
}

export function replyCommentController({ routeId = true } = {}) {
    return async (req, res) => {
        const body = validateCommentReplyBody(req.body);
        const target = normalizeCommentReplyTarget({ routeId: routeId ? req.params.id : null, body });
        const { provider, meta } = getProviderContext(req, { target, dryRun: true });
        const data = await provider.replyComment(target, body);
        return sendSuccess(res, data, { statusCode: 202, meta });
    };
}
