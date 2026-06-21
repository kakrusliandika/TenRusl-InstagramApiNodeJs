export default {
    async fetch(request, env) {
        const origin = env.APP_BASE_URL || "https://example-origin.invalid";
        const url = new URL(request.url);
        const target = new URL(url.pathname + url.search, origin);
        return fetch(target, request);
    },
};
