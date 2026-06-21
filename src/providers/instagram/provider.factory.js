import { env, PROVIDERS } from "../../config/env.js";
import { AuthorizedInstagramProvider } from "./authorized.provider.js";
import { MockInstagramProvider } from "./mock.provider.js";
import { OfficialInstagramProvider } from "./official.provider.js";
import { PublicInstagramProvider } from "./public.provider.js";

export function createInstagramProvider(providerName = env.igProvider) {
    switch (String(providerName || "").toLowerCase()) {
        case PROVIDERS.OFFICIAL:
            return new OfficialInstagramProvider();
        case PROVIDERS.PUBLIC:
            return new PublicInstagramProvider();
        case PROVIDERS.AUTHORIZED:
            return new AuthorizedInstagramProvider();
        case PROVIDERS.MOCK:
        default:
            return new MockInstagramProvider();
    }
}

export function getInstagramProvider() {
    return createInstagramProvider(env.igProvider);
}
