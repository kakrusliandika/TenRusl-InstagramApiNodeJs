import test from "node:test";
import assert from "node:assert/strict";

process.env.NODE_ENV = "test";
process.env.IG_PROVIDER = "mock";
process.env.API_KEY_ENABLED = "true";
process.env.API_KEY = "test-api-key-123456";
process.env.RATE_LIMIT_ENABLED = "false";
process.env.METRICS_PUBLIC = "false";
process.env.CAPABILITIES_PUBLIC = "false";
process.env.CORS_ORIGIN = "https://allowed.example";
process.env.BODY_LIMIT = "1kb";

const { createApp } = await import("../app.js");
const { startTestServer } = await import("./server-helper.js");

const apiKey = process.env.API_KEY;
const allowedOrigin = "https://allowed.example";
const deniedOrigin = "https://denied.example";

const instagramLink = encodeURIComponent("https://www.instagram.com/p/ABC123def45/");
const storyLink = encodeURIComponent("https://www.instagram.com/stories/tenrusl/123456789/");
const profileLink = encodeURIComponent("https://www.instagram.com/tenrusl/");

const publishBody = {
    mediaUrl: "https://example.com/image.jpg",
    mediaType: "IMAGE",
    caption: "Smoke dry-run publish",
    dryRun: true,
};
const replyBody = { text: "Smoke dry-run reply", dryRun: true };
const messageBody = { username: "tenrusl", text: "Smoke dry-run message", dryRun: true };

const publicGetEndpoints = ["/", "/health", "/ready", "/live"];

const privateGetEndpoints = [
    "/metrics",
    "/metrics?format=json",
    "/capabilities",
    "/v1/get/accounts/tenrusl",
    "/v1/get/profiles/tenrusl",
    `/v1/get/profiles/by-link?link=${profileLink}`,
    "/v1/get/followers/tenrusl?limit=2",
    "/v1/get/following/123456?limit=2",
    "/v1/get/photos/users/tenrusl?limit=2",
    `/v1/get/photos/by-link?link=${instagramLink}`,
    "/v1/get/feeds/users/123456?limit=2",
    `/v1/get/feeds/by-link?link=${instagramLink}`,
    "/v1/get/statuses/users/tenrusl?limit=2",
    `/v1/get/statuses/by-link?link=${storyLink}`,
    "/v1/get/posts/users/tenrusl?limit=2",
    "/v1/get/posts/post_123",
    `/v1/get/posts/by-link?link=${instagramLink}`,
    "/v1/get/reels/users/tenrusl?limit=2",
    `/v1/get/reels/by-link?link=${instagramLink}`,
    "/v1/get/media/users/tenrusl?limit=2",
    `/v1/get/media/by-link?link=${instagramLink}`,
    `/v1/comments?link=${instagramLink}`,
    "/v1/mentions?limit=2",
    "/v1/hashtags/media?hashtag=tenrusl&limit=2",
    "/v1/insights",
    "/v1/conversations?limit=2",
    "/v1/messages?limit=2",
    "/v1/messages/thread_123?limit=2",
    "/v1/accounts/tenrusl",
    `/v1/profiles/by-link?link=${profileLink}`,
    "/v1/profiles/tenrusl",
    "/v1/followers/tenrusl?limit=2",
    "/v1/following/123456?limit=2",
    `/v1/posts/by-link?link=${instagramLink}`,
    "/v1/posts/post_123",
    "/api/v1/get/profiles/tenrusl",
    "/api/v1/accounts/tenrusl",
    "/api/v1/instagram/tenrusl",
];

const postEndpoints = [
    ["/v1/actions/follow/tenrusl", { dryRun: true }],
    ["/v1/actions/unfollow/123456", { dryRun: true }],
    ["/v1/publish/media", publishBody],
    ["/v1/publish/reels", { ...publishBody, mediaType: "REEL" }],
    ["/v1/publish/photos", publishBody],
    ["/v1/publish/feeds", { ...publishBody, mediaType: "FEED" }],
    ["/v1/publish/statuses", { ...publishBody, mediaType: "STORY" }],
    ["/v1/comments/reply", { ...replyBody, id: "comment_123" }],
    ["/v1/comments/comment_123/reply", replyBody],
    ["/v1/messages/thread_123/send", messageBody],
];

function isJsonResponse(response) {
    return (response.headers.get("content-type") || "").includes("application/json");
}

async function readResponseBody(response) {
    return isJsonResponse(response) ? response.json() : response.text();
}

async function request(baseUrl, path, options = {}) {
    const headers = {
        accept: "application/json",
        origin: allowedOrigin,
        ...(options.body === undefined ? {} : { "content-type": "application/json" }),
        ...(options.headers || {}),
    };
    const response = await fetch(`${baseUrl}${path}`, { ...options, headers });
    const body = await readResponseBody(response);
    return { response, body };
}

function assertEnvelope(body, success) {
    assert.equal(body.success, success);
    assert.ok(Object.hasOwn(body, "data"));
    assert.ok(Object.hasOwn(body, "meta"));
    assert.ok(Object.hasOwn(body, "error"));
}

async function withSmokeServer(testFn) {
    const { server, baseUrl } = await startTestServer(createApp());

    try {
        await testFn({ baseUrl });
    } finally {
        await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    }
}

test("API smoke: every public and private GET endpoint responds without route breakage", async () => {
    await withSmokeServer(async ({ baseUrl }) => {
        for (const path of publicGetEndpoints) {
            const { response, body } = await request(baseUrl, path, { method: "GET" });

            assert.notEqual(response.status, 404, `GET ${path}`);
            assert.ok(response.status < 500, `GET ${path}`);
            if (isJsonResponse(response)) assertEnvelope(body, response.status < 400);
        }

        for (const path of privateGetEndpoints) {
            const { response, body } = await request(baseUrl, path, {
                method: "GET",
                headers: { "x-api-key": apiKey },
            });

            assert.notEqual(response.status, 404, `GET ${path}`);
            assert.ok(response.status < 500, `GET ${path}`);
            if (isJsonResponse(response)) assertEnvelope(body, response.status < 400);
        }
    });
});

test("API smoke: every POST endpoint responds with standard envelope and no route breakage", async () => {
    await withSmokeServer(async ({ baseUrl }) => {
        for (const [path, payload] of postEndpoints) {
            const { response, body } = await request(baseUrl, path, {
                method: "POST",
                headers: { "x-api-key": apiKey },
                body: JSON.stringify(payload),
            });

            assert.notEqual(response.status, 404, `POST ${path}`);
            assert.ok(response.status < 500, `POST ${path}`);
            assertEnvelope(body, response.status < 400);
        }
    });
});

test("API smoke: malformed JSON returns a standard error envelope", async () => {
    await withSmokeServer(async ({ baseUrl }) => {
        const { response, body } = await request(baseUrl, "/v1/actions/follow/tenrusl", {
            method: "POST",
            headers: { "x-api-key": apiKey, "content-type": "application/json" },
            body: '{"dryRun": true',
        });

        assert.equal(response.status, 400);
        assertEnvelope(body, false);
    });
});

test("API smoke: oversized JSON body is rejected before controller execution", async () => {
    await withSmokeServer(async ({ baseUrl }) => {
        const { response, body } = await request(baseUrl, "/v1/publish/media", {
            method: "POST",
            headers: { "x-api-key": apiKey },
            body: JSON.stringify({
                ...publishBody,
                caption: "x".repeat(2_048),
            }),
        });

        assert.equal(response.status, 413);
        assertEnvelope(body, false);
    });
});

test("API smoke: query all=false is accepted and remains enveloped", async () => {
    await withSmokeServer(async ({ baseUrl }) => {
        const { response, body } = await request(baseUrl, "/v1/mentions?all=false&limit=2", {
            method: "GET",
            headers: { "x-api-key": apiKey },
        });

        assert.equal(response.status, 200);
        assertEnvelope(body, true);
    });
});

test("API smoke: denied CORS origin fails before private endpoint response is exposed", async () => {
    await withSmokeServer(async ({ baseUrl }) => {
        const { response, body } = await request(baseUrl, "/v1/get/profiles/tenrusl", {
            method: "GET",
            headers: { origin: deniedOrigin, "x-api-key": apiKey },
        });

        assert.equal(response.status, 500);
        assertEnvelope(body, false);
        assert.equal(response.headers.get("access-control-allow-origin"), null);
    });
});

test("API smoke: private endpoints require API key and accept x-api-key or bearer credentials", async () => {
    await withSmokeServer(async ({ baseUrl }) => {
        const missing = await request(baseUrl, "/v1/get/profiles/tenrusl", { method: "GET" });
        assert.equal(missing.response.status, 401);
        assertEnvelope(missing.body, false);

        const invalid = await request(baseUrl, "/v1/get/profiles/tenrusl", {
            method: "GET",
            headers: { "x-api-key": "wrong-key" },
        });
        assert.equal(invalid.response.status, 401);
        assertEnvelope(invalid.body, false);

        const xApiKey = await request(baseUrl, "/v1/get/profiles/tenrusl", {
            method: "GET",
            headers: { "x-api-key": apiKey },
        });
        assert.equal(xApiKey.response.status, 200);
        assertEnvelope(xApiKey.body, true);

        const bearer = await request(baseUrl, "/v1/get/profiles/tenrusl", {
            method: "GET",
            headers: { authorization: `Bearer ${apiKey}` },
        });
        assert.equal(bearer.response.status, 200);
        assertEnvelope(bearer.body, true);
    });
});
