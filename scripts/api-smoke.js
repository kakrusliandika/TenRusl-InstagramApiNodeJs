import { createServer } from "node:http";

process.env.NODE_ENV = process.env.NODE_ENV || "test";
process.env.IG_PROVIDER = "mock";
process.env.API_KEY_ENABLED = "false";
process.env.RATE_LIMIT_ENABLED = "false";
process.env.METRICS_PUBLIC = "true";
process.env.CAPABILITIES_PUBLIC = "true";

const SAFE_PORT_START = 30_000;
const SAFE_PORT_SPAN = 20_000;

const GET_ENDPOINTS = [
    "/health",
    "/ready",
    "/live",
    "/metrics",
    "/metrics?format=json",
    "/capabilities",
    "/v1/get/accounts/tenrusl",
    "/v1/get/profiles/tenrusl",
    "/v1/get/profiles/by-link?link=https://www.instagram.com/tenrusl/",
    "/v1/get/followers/tenrusl",
    "/v1/get/following/123456",
    "/v1/get/photos/users/tenrusl",
    "/v1/get/photos/by-link?link=https://www.instagram.com/p/ABC123/",
    "/v1/get/feeds/users/123456",
    "/v1/get/feeds/by-link?link=https://www.instagram.com/p/ABC123/",
    "/v1/get/statuses/users/tenrusl",
    "/v1/get/statuses/by-link?link=https://www.instagram.com/stories/tenrusl/123456789/",
    "/v1/get/posts/users/tenrusl",
    "/v1/get/posts/post_123",
    "/v1/get/posts/by-link?link=https://www.instagram.com/p/ABC123/",
    "/v1/get/reels/users/tenrusl",
    "/v1/get/reels/by-link?link=https://www.instagram.com/reel/ABC123/",
    "/v1/get/media/users/tenrusl",
    "/v1/get/media/by-link?link=https://www.instagram.com/p/ABC123/",
    "/v1/comments?link=https://www.instagram.com/p/ABC123/",
    "/v1/mentions",
    "/v1/hashtags/media?hashtag=tenrusl",
    "/v1/insights",
    "/v1/conversations",
    "/v1/messages",
    "/v1/messages/thread_123",
    "/v1/accounts/tenrusl",
    "/v1/profiles/by-link?link=https://www.instagram.com/tenrusl/",
    "/v1/profiles/tenrusl",
    "/v1/followers/tenrusl",
    "/v1/following/123456",
    "/v1/posts/by-link?link=https://www.instagram.com/p/ABC123/",
    "/v1/posts/post_123",
];

const POST_ENDPOINTS = [
    {
        endpoint: "/v1/actions/follow/tenrusl",
        body: { dryRun: true },
    },
    {
        endpoint: "/v1/actions/unfollow/123456",
        body: { dryRun: true },
    },
    {
        endpoint: "/v1/publish/media",
        body: {
            mediaUrl: "https://example.com/image.jpg",
            mediaType: "IMAGE",
            caption: "Smoke test dry run",
            dryRun: true,
        },
    },
    {
        endpoint: "/v1/publish/reels",
        body: { mediaUrl: "https://example.com/reel.mp4", caption: "Smoke", dryRun: true },
    },
    {
        endpoint: "/v1/publish/photos",
        body: { mediaUrl: "https://example.com/photo.jpg", caption: "Smoke", dryRun: true },
    },
    {
        endpoint: "/v1/publish/feeds",
        body: { mediaUrl: "https://example.com/feed.jpg", caption: "Smoke", dryRun: true },
    },
    {
        endpoint: "/v1/publish/statuses",
        body: { mediaUrl: "https://example.com/status.jpg", dryRun: true },
    },
    {
        endpoint: "/v1/comments/comment_123/reply",
        body: { text: "Smoke test reply", dryRun: true },
    },
    {
        endpoint: "/v1/comments/reply",
        body: { id: "comment_123", text: "Smoke test reply", dryRun: true },
    },
    {
        endpoint: "/v1/messages/thread_123/send",
        body: { username: "tenrusl", text: "Smoke test message", dryRun: true },
    },
];

const args = process.argv.slice(2);
const methodArg = args.find((arg) => arg.startsWith("--method="));
const method = methodArg ? methodArg.split("=")[1].toLowerCase() : "get";

const validMethods = new Set(["get", "post", "api"]);
if (!validMethods.has(method)) {
    console.error(`Invalid --method=${method}. Use: get, post, api`);
    process.exitCode = 1;
    // eslint-disable-next-line no-process-exit
    process.exit(1);
}

function candidatePort(attempt) {
    return SAFE_PORT_START + ((process.pid + attempt * 37) % SAFE_PORT_SPAN);
}

function listen(server, port) {
    return new Promise((resolve, reject) => {
        const onError = (error) => {
            server.off("listening", onListening);
            reject(error);
        };
        const onListening = () => {
            server.off("error", onError);
            resolve();
        };

        server.once("error", onError);
        server.once("listening", onListening);
        server.listen(port, "127.0.0.1");
    });
}

async function startServer(app) {
    for (let attempt = 0; attempt < 100; attempt += 1) {
        const server = createServer(app);

        try {
            await listen(server, candidatePort(attempt));
            const { port } = server.address();
            return { server, baseUrl: `http://127.0.0.1:${port}` };
        } catch (error) {
            if (!["EADDRINUSE", "EACCES"].includes(error.code)) throw error;
        }
    }

    throw new Error("Unable to start smoke test server on a safe local port.");
}

async function requestGet(baseUrl, endpoint) {
    const response = await fetch(`${baseUrl}${endpoint}`, {
        method: "GET",
        headers: {
            accept:
                endpoint.startsWith("/metrics") && !endpoint.includes("format=json")
                    ? "text/plain"
                    : "application/json",
        },
    });

    let body = "";
    try {
        body = await response.text();
    } catch {
        body = "";
    }

    return {
        method: "GET",
        endpoint,
        statusCode: response.status,
        ok: response.status === 200,
        bodyPreview: body.slice(0, 160).replace(/\s+/g, " ").trim(),
    };
}

async function requestPost(baseUrl, endpoint, body) {
    const response = await fetch(`${baseUrl}${endpoint}`, {
        method: "POST",
        headers: {
            "content-type": "application/json",
            accept: "application/json",
        },
        body: JSON.stringify(body),
    });

    let responseBody = "";
    try {
        responseBody = await response.text();
    } catch {
        responseBody = "";
    }

    return {
        method: "POST",
        endpoint,
        statusCode: response.status,
        ok: response.status === 202,
        bodyPreview: responseBody.slice(0, 160).replace(/\s+/g, " ").trim(),
    };
}

function printSummary(getResults, postResults) {
    const allResults = [...getResults, ...postResults];
    const failed = allResults.filter((result) => !result.ok);

    const statusCounts = allResults.reduce((counts, result) => {
        counts[result.statusCode] = (counts[result.statusCode] || 0) + 1;
        return counts;
    }, {});

    const methodCounts = allResults.reduce((counts, result) => {
        counts[result.method] = (counts[result.method] || 0) + 1;
        return counts;
    }, {});

    console.log("API smoke summary");
    console.log(`Provider: ${process.env.IG_PROVIDER}`);
    if (getResults.length > 0) {
        console.log(`Total GET: ${getResults.length}`);
    }
    if (postResults.length > 0) {
        console.log(`Total POST: ${postResults.length}`);
    }
    console.log(`Total endpoints: ${allResults.length}`);
    console.log(
        `Status codes: ${Object.entries(statusCounts)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([status, count]) => `${status}=${count}`)
            .join(", ")}`
    );
    console.log(`Failed endpoints: ${failed.length}`);

    if (failed.length > 0) {
        for (const result of failed) {
            console.log(`- ${result.method} ${result.statusCode} ${result.endpoint} ${result.bodyPreview}`);
        }
    }
}

const { createApp } = await import("../src/app.js");
const { server, baseUrl } = await startServer(createApp());

try {
    const getResults = [];
    const postResults = [];

    if (method === "get" || method === "api") {
        for (const endpoint of GET_ENDPOINTS) {
            getResults.push(await requestGet(baseUrl, endpoint));
        }
    }

    if (method === "post" || method === "api") {
        for (const { endpoint, body } of POST_ENDPOINTS) {
            postResults.push(await requestPost(baseUrl, endpoint, body));
        }
    }

    printSummary(getResults, postResults);

    const allResults = [...getResults, ...postResults];
    if (allResults.some((result) => !result.ok)) {
        process.exitCode = 1;
    }
} finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
}