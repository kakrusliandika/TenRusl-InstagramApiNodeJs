import { env } from "../../config/env.js";
import { AppError, ERROR_CODES } from "../../utils/errors.js";
import { capabilitiesFor } from "./capabilities.js";

function now() {
    return new Date().toISOString();
}

function validUrl(value) {
    try {
        return value ? new URL(value) : null;
    } catch {
        return null;
    }
}

function upstreamUrl(baseUrl, operation) {
    const base = String(baseUrl).replace(/\/$/, "");
    return new URL(`${base}/${String(operation).replace(/^\//, "")}`);
}

export class PublicInstagramProvider {
    constructor(options = {}) {
        this.config = options.config || env;
        this.name = "public";
        this.mode = "public";
        this.safeMode = true;
        this.upstreamBaseUrl = validUrl(this.config.publicDataUpstreamUrl);
        this.ready = Boolean(this.config.publicDataEnabled && this.upstreamBaseUrl);
    }

    status() {
        return {
            provider: this.name,
            mode: this.mode,
            ready: this.ready,
            safeMode: this.safeMode,
            enabled: this.config.publicDataEnabled,
            upstreamConfigured: Boolean(this.upstreamBaseUrl),
            capabilities: capabilitiesFor(this.name),
            implementation: "external-public-data-upstream-boundary",
            writeMode: "read-only",
            generatedAt: now(),
        };
    }

    ensureConfigured() {
        if (this.ready) return;

        throw new AppError(
            "Public provider is disabled or missing a valid PUBLIC_DATA_UPSTREAM_URL.",
            {
                statusCode: 503,
                code: ERROR_CODES.PROVIDER_NOT_CONFIGURED,
                details: {
                    provider: "public",
                    required: ["PUBLIC_DATA_ENABLED=true", "PUBLIC_DATA_UPSTREAM_URL"],
                },
            }
        );
    }

    async upstreamRequest(operation, payload = {}) {
        this.ensureConfigured();

        const url = upstreamUrl(this.upstreamBaseUrl, operation);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.config.providerRequestTimeoutMs);

        let response;
        try {
            response = await fetch(url, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(payload),
                signal: controller.signal,
            });
        } catch (error) {
            throw new AppError("Public data upstream request failed before a response was received.", {
                statusCode: error.name === "AbortError" ? 504 : 502,
                code: ERROR_CODES.PROVIDER_UPSTREAM_ERROR,
                details: { provider: "public", operation, reason: error.message },
            });
        } finally {
            clearTimeout(timeout);
        }

        let data;
        try {
            data = await response.json();
        } catch {
            throw new AppError("Public data upstream returned a non-JSON response.", {
                statusCode: 502,
                code: ERROR_CODES.PROVIDER_UPSTREAM_ERROR,
                details: { provider: "public", operation, upstreamStatus: response.status },
            });
        }

        if (!response.ok) {
            throw new AppError("Public data upstream returned an error response.", {
                statusCode: 502,
                code: ERROR_CODES.PROVIDER_UPSTREAM_ERROR,
                details: { provider: "public", operation, upstreamStatus: response.status, upstreamError: data },
            });
        }

        if (!data || typeof data !== "object") {
            throw new AppError("Public data upstream returned an invalid response body.", {
                statusCode: 502,
                code: ERROR_CODES.PROVIDER_UPSTREAM_ERROR,
                details: { provider: "public", operation, upstreamStatus: response.status },
            });
        }

        return {
            provider: this.status(),
            resource: data.resource || operation.split("/")[0],
            operation,
            upstream: data,
        };
    }

    unavailable(operation, details = {}) {
        throw new AppError("Public provider operation is not available through the public-data upstream boundary.", {
            statusCode: 403,
            code: ERROR_CODES.PROVIDER_OPERATION_DISABLED,
            details: { provider: "public", operation, ...details },
        });
    }

    async getAccount(identifier) { return this.upstreamRequest("accounts/get", { identifier }); }
    async getProfile(identifier) { return this.upstreamRequest("profiles/get", { identifier }); }
    async getProfileByLink(link) { return this.upstreamRequest("profiles/get-by-link", { link }); }
    async getFollowers(identifier, query = {}) { return this.upstreamRequest("followers/list", { identifier, query }); }
    async getFollowing(identifier, query = {}) { return this.upstreamRequest("following/list", { identifier, query }); }
    async getUserCollection(resource, identifier, query = {}) {
        return this.upstreamRequest(`${resource}/list-by-user`, { identifier, query });
    }
    async getByLink(resource, link) { return this.upstreamRequest(`${resource}/get-by-link`, { link }); }
    async getPostById(id) { return this.upstreamRequest("posts/get", { id }); }
    async getComments(query = {}) { return this.upstreamRequest("comments/list", { query }); }
    async getMentions(query = {}) { return this.upstreamRequest("mentions/list", { query }); }
    async getHashtagMedia(query = {}) { return this.upstreamRequest("hashtags/media", { query }); }

    async getInsights() { this.unavailable("get-insights", { reason: "not-public-data" }); }
    async getConversations() { this.unavailable("get-conversations", { reason: "not-public-data" }); }
    async getMessages() { this.unavailable("get-messages", { reason: "not-public-data" }); }
    async getMessageThread() { this.unavailable("get-message-thread", { reason: "not-public-data" }); }
    async performAction(action) { this.unavailable("perform-action", { action, reason: "write-operation" }); }
    async publish(resource) { this.unavailable("publish", { resource, reason: "write-operation" }); }
    async replyComment() { this.unavailable("reply-comment", { reason: "write-operation" }); }
    async sendMessage() { this.unavailable("send-message", { reason: "write-operation" }); }
}
