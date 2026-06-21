import { AppError, ERROR_CODES } from "./errors.js";

const VALID_MEDIA_TYPES = new Set(["p", "reel", "tv"]);

export function parseInstagramUrl(rawUrl, { allowProfile = false, allowStories = true } = {}) {
    if (!rawUrl || typeof rawUrl !== "string") {
        throw new AppError("Instagram link is required.", {
            statusCode: 400,
            code: ERROR_CODES.INSTAGRAM_LINK_INVALID,
        });
    }

    let parsed;
    try {
        parsed = new URL(rawUrl.trim());
    } catch {
        throw new AppError("Instagram link must be a valid URL.", {
            statusCode: 400,
            code: ERROR_CODES.INSTAGRAM_LINK_INVALID,
        });
    }

    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    if (host !== "instagram.com" && !host.endsWith(".instagram.com")) {
        throw new AppError("Link must use an instagram.com host.", {
            statusCode: 400,
            code: ERROR_CODES.INSTAGRAM_LINK_INVALID,
            details: { host: parsed.hostname },
        });
    }

    const segments = parsed.pathname.split("/").filter(Boolean);
    const [first, second, third] = segments;

    if (VALID_MEDIA_TYPES.has(first) && second) {
        return {
            url: parsed.toString(),
            kind: first === "p" ? "post" : first,
            shortcode: second,
            path: parsed.pathname,
        };
    }

    if (allowStories && first === "stories" && second && third) {
        return {
            url: parsed.toString(),
            kind: "status",
            username: second,
            storyId: third,
            path: parsed.pathname,
        };
    }

    if (allowProfile && first && !second && /^[A-Za-z0-9._]{1,30}$/.test(first)) {
        return {
            url: parsed.toString(),
            kind: "profile",
            username: first,
            path: parsed.pathname,
        };
    }

    throw new AppError("Instagram link must point to a supported post, reel, tv, story, or profile URL.", {
        statusCode: 400,
        code: ERROR_CODES.INSTAGRAM_LINK_INVALID,
        details: { path: parsed.pathname },
    });
}
