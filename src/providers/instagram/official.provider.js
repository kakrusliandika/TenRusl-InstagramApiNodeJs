import { env } from "../../config/env.js";
import { AppError, ERROR_CODES } from "../../utils/errors.js";
import { capabilitiesFor } from "./capabilities.js";

function now() {
    return new Date().toISOString();
}

function validUrl(value) {
    try {
        const url = new URL(value);
        if (!["http:", "https:"].includes(url.protocol)) return null;
        if (url.username || url.password) return null;
        return url;
    } catch {
        return null;
    }
}

function validMetaApiVersion(value) {
    return /^v\d+\.\d+$/.test(String(value || ""));
}

function validMetaIgUserId(value) {
    return /^[A-Za-z0-9_:-]{2,128}$/.test(String(value || ""));
}

function appendPath(baseUrl, path) {
    const url = new URL(baseUrl);
    const basePath = url.pathname.replace(/\/$/, "");
    url.pathname = `${basePath}/${String(path).replace(/^\//, "")}`;
    return url;
}

export class OfficialInstagramProvider {
    constructor(options = {}) {
        this.config = options.config || env;
        this.name = "official";
        this.mode = "official";
        this.safeMode = true;
        this.graphBaseUrl = validUrl(this.config.metaGraphBaseUrl);
        this.metaApiVersionValid = validMetaApiVersion(this.config.metaApiVersion);
        this.metaIgUserIdValid = validMetaIgUserId(this.config.metaIgUserId);
        this.ready = Boolean(
            this.graphBaseUrl
            && this.metaApiVersionValid
            && this.config.metaAccessToken
            && this.metaIgUserIdValid
        );
    }

    status() {
        return {
            provider: this.name,
            mode: this.mode,
            ready: this.ready,
            safeMode: this.safeMode,
            officialConfigured: this.ready,
            metaApiVersion: this.config.metaApiVersion,
            metaApiVersionValid: this.metaApiVersionValid,
            metaIgUserIdConfigured: this.metaIgUserIdValid,
            graphBaseUrlConfigured: Boolean(this.graphBaseUrl),
            capabilities: capabilitiesFor(this.name),
            implementation: "partial-meta-graph-read-boundary",
            writeMode: "not-implemented",
            generatedAt: now(),
        };
    }

    ensureConfigured() {
        if (this.ready) return;

        throw new AppError(
            "Official Instagram provider is not configured. Set valid META_GRAPH_BASE_URL, META_API_VERSION, META_ACCESS_TOKEN, and META_IG_USER_ID.",
            {
                statusCode: 503,
                code: ERROR_CODES.PROVIDER_NOT_CONFIGURED,
                details: {
                    provider: "official",
                    required: ["META_GRAPH_BASE_URL", "META_API_VERSION", "META_ACCESS_TOKEN", "META_IG_USER_ID"],
                    validMetaApiVersion: "v<major>.<minor>",
                },
            }
        );
    }

    unsupported(operation, details = {}) {
        throw new AppError(
            "Official provider operation is not implemented in this gateway. Add a reviewed Meta Graph API integration before enabling it for production traffic.",
            {
                statusCode: 501,
                code: ERROR_CODES.PROVIDER_OPERATION_DISABLED,
                details: { provider: "official", operation, ...details },
            }
        );
    }

    async graphRequest(path, searchParams = {}) {
        this.ensureConfigured();

        const url = appendPath(this.graphBaseUrl, `${this.config.metaApiVersion}/${path}`);
        for (const [key, value] of Object.entries(searchParams)) {
            if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.config.providerRequestTimeoutMs);

        let response;
        try {
            response = await fetch(url, {
                method: "GET",
                headers: { authorization: `Bearer ${this.config.metaAccessToken}` },
                signal: controller.signal,
            });
        } catch (error) {
            throw new AppError("Meta Graph API request failed before a response was received.", {
                statusCode: error.name === "AbortError" ? 504 : 502,
                code: ERROR_CODES.PROVIDER_UPSTREAM_ERROR,
                details: { provider: "official", reason: error.message },
            });
        } finally {
            clearTimeout(timeout);
        }

        let payload;
        try {
            payload = await response.json();
        } catch {
            throw new AppError("Meta Graph API returned a non-JSON response.", {
                statusCode: 502,
                code: ERROR_CODES.PROVIDER_UPSTREAM_ERROR,
                details: { provider: "official", upstreamStatus: response.status },
            });
        }

        if (!response.ok) {
            throw new AppError("Meta Graph API returned an error response.", {
                statusCode: 502,
                code: ERROR_CODES.PROVIDER_UPSTREAM_ERROR,
                details: {
                    provider: "official",
                    upstreamStatus: response.status,
                    upstreamError: payload?.error?.message || payload?.error || payload,
                },
            });
        }

        if (!payload || typeof payload !== "object") {
            throw new AppError("Meta Graph API returned an invalid response body.", {
                statusCode: 502,
                code: ERROR_CODES.PROVIDER_UPSTREAM_ERROR,
                details: { provider: "official", upstreamStatus: response.status },
            });
        }

        return payload;
    }

    ensureConfiguredAccount(identifier) {
        this.ensureConfigured();
        if (String(identifier) === String(this.config.metaIgUserId)) return;
        this.unsupported("configured-account-only", {
            requestedIdentifier: identifier,
            supportedIdentifier: this.config.metaIgUserId,
        });
    }

    async getAccount(identifier) {
        this.ensureConfiguredAccount(identifier);
        const account = await this.graphRequest(this.config.metaIgUserId, {
            fields: "id,username,name,account_type,media_count",
        });
        return { provider: this.status(), resource: "accounts", operation: "get-account", account };
    }

    async getProfile(identifier) {
        this.ensureConfiguredAccount(identifier);
        const profile = await this.graphRequest(this.config.metaIgUserId, {
            fields: "id,username,name,biography,profile_picture_url,followers_count,follows_count,media_count",
        });
        return { provider: this.status(), resource: "profiles", operation: "get-profile", profile };
    }

    async getInsights(query = {}) {
        const metrics = query.metric || query.metrics || "impressions,reach,profile_views";
        const period = query.period || "day";
        const insights = await this.graphRequest(`${this.config.metaIgUserId}/insights`, { metric: metrics, period });
        return { provider: this.status(), resource: "insights", operation: "get-insights", insights };
    }

    async getProfileByLink() { this.unsupported("get-profile-by-link"); }
    async getFollowers() { this.unsupported("get-followers"); }
    async getFollowing() { this.unsupported("get-following"); }
    async performAction(action) { this.unsupported("perform-action", { action }); }
    async getUserCollection(resource) { this.unsupported("get-user-collection", { resource }); }
    async getByLink(resource) { this.unsupported("get-by-link", { resource }); }
    async getPostById() { this.unsupported("get-post-by-id"); }
    async publish(resource) { this.unsupported("publish", { resource }); }
    async getComments() { this.unsupported("get-comments"); }
    async replyComment() { this.unsupported("reply-comment"); }
    async getMentions() { this.unsupported("get-mentions"); }
    async getHashtagMedia() { this.unsupported("get-hashtag-media"); }
    async getConversations() { this.unsupported("get-conversations"); }
    async getMessages() { this.unsupported("get-messages"); }
    async getMessageThread() { this.unsupported("get-message-thread"); }
    async sendMessage() { this.unsupported("send-message"); }
}
