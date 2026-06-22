import { AppError, ERROR_CODES } from "./errors.js";
import {
    identifierSchema,
    hashtagQuerySchema,
    idSchema,
    linkQuerySchema,
    usernameSchema,
} from "../schemas/common.schema.js";
import { actionBodySchema } from "../schemas/action.schema.js";
import { commentReplyBodySchema } from "../schemas/comment.schema.js";
import { messageBodySchema } from "../schemas/message.schema.js";
import { collectionQuerySchema, publishBodySchema } from "../schemas/post.schema.js";
import { parseInstagramUrl } from "./instagram-url.js";

function failFromZod(parsed, message = "Request validation failed.") {
    if (parsed.success) return parsed.data;
    throw new AppError(message, {
        statusCode: 400,
        code: ERROR_CODES.VALIDATION_ERROR,
        details: parsed.error.flatten(),
    });
}

export function validateIdentifier(raw) {
    const value = failFromZod(identifierSchema.safeParse(raw), "Identifier is invalid.").replace(/^@/, "");
    if (/^[0-9]+$/.test(value) || value.startsWith("ig_")) return { value, type: "id" };
    try {
        const username = failFromZod(usernameSchema.safeParse(value), "Username is invalid.");
        return { value: username, type: "username" };
    } catch (error) {
        if (error instanceof AppError) error.code = ERROR_CODES.USERNAME_INVALID;
        throw error;
    }
}

export function validateUsername(raw) {
    try {
        return failFromZod(usernameSchema.safeParse(raw), "Username is invalid.");
    } catch (error) {
        if (error instanceof AppError) error.code = ERROR_CODES.USERNAME_INVALID;
        throw error;
    }
}

export function validateId(raw) {
    return failFromZod(idSchema.safeParse(raw), "ID is invalid.");
}

export function validatePagination(query = {}) {
    const parsed = failFromZod(collectionQuerySchema.safeParse(query), "Pagination query is invalid.");
    return {
        ...parsed,
        cursor: parsed.cursor ?? null,
    };
}

export function validateLinkQuery(query = {}, options) {
    const parsed = failFromZod(linkQuerySchema.safeParse(query), "Instagram link query is invalid.");
    return parseInstagramUrl(parsed.link || parsed.url, options);
}

export function validateActionBody(body = {}) {
    const parsed = failFromZod(actionBodySchema.safeParse(body || {}), "Action body is invalid.");
    return {
        ...parsed,
        dryRun: parsed.dryRun !== false,
    };
}

export function validatePublishBody(body = {}) {
    const parsed = failFromZod(publishBodySchema.safeParse(body || {}), "Publish body is invalid.");
    return {
        ...parsed,
        dryRun: parsed.dryRun !== false,
    };
}

export function validateMessageBody(body = {}) {
    const parsed = failFromZod(messageBodySchema.safeParse(body || {}), "Message body is invalid.");
    return {
        ...parsed,
        dryRun: parsed.dryRun !== false,
    };
}

export function validateCommentReplyBody(body = {}) {
    const parsed = failFromZod(commentReplyBodySchema.safeParse(body || {}), "Comment reply body is invalid.");
    return {
        ...parsed,
        dryRun: parsed.dryRun !== false,
    };
}

export function validateTargetedCommentReplyBody(body = {}) {
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

export function validateHashtagQuery(query = {}) {
    const parsed = failFromZod(hashtagQuerySchema.safeParse(query), "Hashtag query is invalid.");
    return {
        ...parsed,
        cursor: parsed.cursor ?? null,
        hashtag: parsed.hashtag || parsed.tag || "tenrusl",
    };
}
