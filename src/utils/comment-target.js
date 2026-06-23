import { parseInstagramUrl } from "./instagram-url.js";
import { AppError, ERROR_CODES } from "./errors.js";
import { validateCommentReplyBody, validateId } from "./validation.js";

function validateTargetedCommentReplyBody(body = {}) {
    const parsed = validateCommentReplyBody(body);
    if (parsed.id || parsed.link) return parsed;

    throw new AppError("Comment reply body is invalid.", {
        statusCode: 400,
        code: ERROR_CODES.VALIDATION_ERROR,
        details: {
            formErrors: ["id or link is required."],
            fieldErrors: {},
        },
    });
}

export function normalizeCommentReplyTarget({ routeId, body = {} } = {}) {
    if (routeId) {
        return { type: "id", id: validateId(routeId), source: "route" };
    }

    const parsed = validateTargetedCommentReplyBody(body);
    if (parsed.id) {
        return { type: "id", id: validateId(parsed.id), source: "body", priority: "id" };
    }

    return {
        type: "link",
        link: parseInstagramUrl(parsed.link, { allowStories: true }),
        source: "body",
    };
}
