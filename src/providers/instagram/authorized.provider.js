import { env } from "../../config/env.js";
import { AppError, ERROR_CODES } from "../../utils/errors.js";
import { MockInstagramProvider } from "./mock.provider.js";

export class AuthorizedInstagramProvider extends MockInstagramProvider {
    constructor() {
        super({ name: "authorized", mode: "authorized" });
        this.ready = Boolean(env.authorizedProviderEnabled && env.authorizedSessionToken);
        this.safeMode = true;
    }

    status() {
        return {
            ...super.status(),
            ready: this.ready,
            enabled: env.authorizedProviderEnabled,
            compliance:
                "Advanced mode for data owned by the caller or explicitly authorized by the owner. Disabled by default and does not store raw passwords.",
        };
    }

    ensureEnabled() {
        if (!this.ready) {
            throw new AppError(
                "Authorized provider is disabled by default. Enable only for explicitly authorized data and provide a session token.",
                {
                    statusCode: 503,
                    code: ERROR_CODES.PROVIDER_NOT_CONFIGURED,
                    details: {
                        provider: "authorized",
                        required: ["AUTHORIZED_PROVIDER_ENABLED=true", "AUTHORIZED_SESSION_TOKEN"],
                    },
                }
            );
        }
    }

    async performAction(action, identifier, body = {}) {
        if (body.dryRun !== false) return super.performAction(action, identifier, body);
        this.ensureEnabled();
        throw new AppError(
            "Live authorized write action is not implemented. Add a reviewed integration and explicit user consent before enabling.",
            {
                statusCode: 501,
                code: ERROR_CODES.PROVIDER_OPERATION_DISABLED,
                details: { provider: "authorized", action },
            }
        );
    }

    async publish(resource, body = {}) {
        if (body.dryRun !== false) return super.publish(resource, body);
        this.ensureEnabled();
        throw new AppError("Live authorized publishing is not implemented in this safe gateway skeleton.", {
            statusCode: 501,
            code: ERROR_CODES.PROVIDER_OPERATION_DISABLED,
            details: { provider: "authorized", resource },
        });
    }

    async sendMessage(id, body = {}) {
        if (body.dryRun !== false) return super.sendMessage(id, body);
        this.ensureEnabled();
        throw new AppError("Live authorized messaging is not implemented in this safe gateway skeleton.", {
            statusCode: 501,
            code: ERROR_CODES.PROVIDER_OPERATION_DISABLED,
            details: { provider: "authorized" },
        });
    }
}
