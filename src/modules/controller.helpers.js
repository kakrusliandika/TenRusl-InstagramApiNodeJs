import { getInstagramProvider } from "../providers/instagram/index.js";

export function getProviderContext(req, extra = {}) {
    const provider = getInstagramProvider();
    return {
        provider,
        meta: {
            requestId: req.id,
            provider: provider.status(),
            ...extra,
        },
    };
}
