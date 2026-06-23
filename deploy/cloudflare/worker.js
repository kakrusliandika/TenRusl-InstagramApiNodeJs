export default {
    async fetch(request, env) {
        // Templat ini hanya proksi edge. Set ORIGIN_BASE_URL ke origin API yang sudah diterapkan sebelum digunakan.
        if (!env.ORIGIN_BASE_URL) {
            return new Response("ORIGIN_BASE_URL is required for the Cloudflare proxy template.", { status: 500 });
        }
        const origin = env.ORIGIN_BASE_URL;
        const url = new URL(request.url);
        const target = new URL(url.pathname + url.search, origin);
        return fetch(target, request);
    },
};
