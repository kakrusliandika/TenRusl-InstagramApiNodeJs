import { env, PROVIDERS } from "../../config/env.js";
import { AuthorizedInstagramProvider } from "./authorized.provider.js";
import { MockInstagramProvider } from "./mock.provider.js";
import { OfficialInstagramProvider } from "./official.provider.js";
import { PublicInstagramProvider } from "./public.provider.js";
import { AppError, ERROR_CODES } from "../../utils/errors.js";

const providerCache = new Map();

export function normalizeProviderName(providerName = env.igProvider) {
    const normalized = String(providerName || "").toLowerCase();
    if (Object.values(PROVIDERS).includes(normalized)) return normalized;

    throw new AppError("Instagram provider is invalid.", {
        statusCode: 500,
        code: ERROR_CODES.PROVIDER_NOT_CONFIGURED,
        details: { provider: normalized, allowed: Object.values(PROVIDERS) },
    });
}

export function createInstagramProvider(providerName = env.igProvider) {
    const normalized = normalizeProviderName(providerName);
    switch (normalized) {
        case PROVIDERS.OFFICIAL:
            return new OfficialInstagramProvider();
        case PROVIDERS.PUBLIC:
            return new PublicInstagramProvider();
        case PROVIDERS.AUTHORIZED:
            return new AuthorizedInstagramProvider();
        case PROVIDERS.MOCK:
            return new MockInstagramProvider();
        default:
            return new MockInstagramProvider();
    }
}

export function getInstagramProvider() {
    const providerName = normalizeProviderName(env.igProvider);
    if (!providerCache.has(providerName)) {
        providerCache.set(providerName, createInstagramProvider(providerName));
    }
    return providerCache.get(providerName);
}

export function clearInstagramProviderCache() {
    providerCache.clear();
}
