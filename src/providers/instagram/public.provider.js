import { env } from "../../config/env.js";
import { AppError, ERROR_CODES } from "../../utils/errors.js";
import { MockInstagramProvider } from "./mock.provider.js";

export class PublicInstagramProvider extends MockInstagramProvider {
    constructor() {
        super({ name: "public", mode: "public" });
        this.ready = Boolean(env.publicDataEnabled && env.publicDataUpstreamUrl);
        this.safeMode = true;
    }

    status() {
        return {
            ...super.status(),
            ready: this.ready,
            upstreamConfigured: Boolean(env.publicDataUpstreamUrl),
            compliance:
                "Public adapter is limited to allowed public data paths and respects login boundaries, platform protections, quotas, and access controls.",
        };
    }

    async performAction(action, identifier, body = {}) {
        if (body.dryRun !== false) return super.performAction(action, identifier, body);
        throw new AppError("Public provider is read-only and cannot run live write actions.", {
            statusCode: 403,
            code: ERROR_CODES.PROVIDER_OPERATION_DISABLED,
            details: { provider: "public", action },
        });
    }

    async publish(resource, body = {}) {
        if (body.dryRun !== false) return super.publish(resource, body);
        throw new AppError("Public provider is read-only and cannot publish live content.", {
            statusCode: 403,
            code: ERROR_CODES.PROVIDER_OPERATION_DISABLED,
            details: { provider: "public", resource },
        });
    }

    async sendMessage(id, body = {}) {
        if (body.dryRun !== false) return super.sendMessage(id, body);
        throw new AppError("Public provider is read-only and cannot send live messages.", {
            statusCode: 403,
            code: ERROR_CODES.PROVIDER_OPERATION_DISABLED,
            details: { provider: "public" },
        });
    }
}
