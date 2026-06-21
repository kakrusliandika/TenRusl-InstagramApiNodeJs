import { env } from "../../config/env.js";
import { AppError, ERROR_CODES } from "../../utils/errors.js";
import { MockInstagramProvider } from "./mock.provider.js";

export class OfficialInstagramProvider extends MockInstagramProvider {
    constructor() {
        super({ name: "official", mode: "official" });
        this.ready = Boolean(env.metaAccessToken && env.metaIgUserId);
        this.safeMode = true;
    }

    status() {
        return {
            ...super.status(),
            officialConfigured: this.ready,
            metaApiVersion: env.metaApiVersion,
            writeMode: "official-token-required",
            compliance:
                "Use only Meta / Instagram Graph API scopes approved for the authenticated Business or Creator account.",
        };
    }

    ensureConfigured() {
        if (!this.ready) {
            throw new AppError(
                "Official Instagram provider is not configured. Set META_ACCESS_TOKEN and META_IG_USER_ID.",
                {
                    statusCode: 503,
                    code: ERROR_CODES.PROVIDER_NOT_CONFIGURED,
                    details: { provider: "official", required: ["META_ACCESS_TOKEN", "META_IG_USER_ID"] },
                }
            );
        }
    }

    async getInsights(query = {}) {
        this.ensureConfigured();
        return super.getInsights(query);
    }

    async publish(resource, body = {}) {
        if (body.dryRun !== false) return super.publish(resource, body);
        this.ensureConfigured();
        throw new AppError(
            "Live publishing is intentionally not implemented in this gateway skeleton. Wire Meta Graph API after app review and scope approval.",
            {
                statusCode: 501,
                code: ERROR_CODES.PROVIDER_OPERATION_DISABLED,
                details: { provider: "official", resource },
            }
        );
    }

    async performAction(action, identifier, body = {}) {
        if (body.dryRun !== false) return super.performAction(action, identifier, body);
        throw new AppError("Follow/unfollow automation is not exposed by the safe official adapter.", {
            statusCode: 403,
            code: ERROR_CODES.PROVIDER_OPERATION_DISABLED,
            details: { provider: "official", action },
        });
    }
}
