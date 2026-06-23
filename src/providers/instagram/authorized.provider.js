import { env } from "../../config/env.js";
import { AppError, ERROR_CODES } from "../../utils/errors.js";
import { capabilitiesFor } from "./capabilities.js";

function now() {
    return new Date().toISOString();
}

export class AuthorizedInstagramProvider {
    constructor(options = {}) {
        this.config = options.config || env;
        this.name = "authorized";
        this.mode = "authorized";
        this.safeMode = true;
        this.integrationImplemented = options.integrationImplemented === true;
        this.configured = Boolean(
            this.config.authorizedProviderEnabled
            && this.config.authorizedSessionToken
            && this.config.authorizedIntegrationReviewed
        );
        this.ready = Boolean(
            this.configured
            && this.integrationImplemented
        );
    }

    status() {
        return {
            provider: this.name,
            mode: this.mode,
            ready: this.ready,
            safeMode: this.safeMode,
            enabled: this.config.authorizedProviderEnabled,
            integrationReviewed: this.config.authorizedIntegrationReviewed,
            integrationImplemented: this.integrationImplemented,
            capabilities: capabilitiesFor(this.name),
            implementation: "disabled-until-reviewed-integration-is-added",
            writeMode: "not-implemented",
            generatedAt: now(),
        };
    }

    ensureConfigured() {
        if (this.configured) return;

        throw new AppError(
            "Authorized provider is disabled. Enable it only for explicitly authorized data and provide AUTHORIZED_SESSION_TOKEN.",
            {
                statusCode: 503,
                code: ERROR_CODES.PROVIDER_NOT_CONFIGURED,
                details: {
                    provider: "authorized",
                    required: [
                        "AUTHORIZED_PROVIDER_ENABLED=true",
                        "AUTHORIZED_SESSION_TOKEN",
                        "AUTHORIZED_INTEGRATION_REVIEWED=true",
                    ],
                },
            }
        );
    }

    notImplemented(operation, details = {}) {
        this.ensureConfigured();
        throw new AppError(
            "Authorized provider operation is not implemented. Add a reviewed integration and explicit user consent before enabling production traffic.",
            {
                statusCode: 501,
                code: ERROR_CODES.PROVIDER_OPERATION_DISABLED,
                details: { provider: "authorized", operation, ...details },
            }
        );
    }

    async getAccount() { this.notImplemented("get-account"); }
    async getProfile() { this.notImplemented("get-profile"); }
    async getProfileByLink() { this.notImplemented("get-profile-by-link"); }
    async getFollowers() { this.notImplemented("get-followers"); }
    async getFollowing() { this.notImplemented("get-following"); }
    async performAction(action) { this.notImplemented("perform-action", { action }); }
    async getUserCollection(resource) { this.notImplemented("get-user-collection", { resource }); }
    async getByLink(resource) { this.notImplemented("get-by-link", { resource }); }
    async getPostById() { this.notImplemented("get-post-by-id"); }
    async publish(resource) { this.notImplemented("publish", { resource }); }
    async getComments() { this.notImplemented("get-comments"); }
    async replyComment() { this.notImplemented("reply-comment"); }
    async getMentions() { this.notImplemented("get-mentions"); }
    async getHashtagMedia() { this.notImplemented("get-hashtag-media"); }
    async getInsights() { this.notImplemented("get-insights"); }
    async getConversations() { this.notImplemented("get-conversations"); }
    async getMessages() { this.notImplemented("get-messages"); }
    async getMessageThread() { this.notImplemented("get-message-thread"); }
    async sendMessage() { this.notImplemented("send-message"); }
}
