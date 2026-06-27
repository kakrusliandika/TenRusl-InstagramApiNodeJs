import { createServer } from "node:http";

process.env.NODE_ENV = process.env.NODE_ENV || "test";
process.env.IG_PROVIDER = "mock";
process.env.API_KEY_ENABLED = "false";
process.env.RATE_LIMIT_ENABLED = "false";
process.env.METRICS_PUBLIC = "true";
process.env.CAPABILITIES_PUBLIC = "true";

const SAFE_PORT_START = 30_000;
const SAFE_PORT_SPAN = 20_000;
const OK_STATUS_CODES = new Set([200, 400]);

const endpoints = [
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

async function requestEndpoint(baseUrl, endpoint) {
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
        endpoint,
        statusCode: response.status,
        ok: OK_STATUS_CODES.has(response.status),
        bodyPreview: body.slice(0, 160).replace(/\s+/g, " ").trim(),
    };
}

function printSummary(results) {
    const failed = results.filter((result) => !result.ok);
    const statusCounts = results.reduce((counts, result) => {
        counts[result.statusCode] = (counts[result.statusCode] || 0) + 1;
        return counts;
    }, {});

    console.log("GET smoke summary");
    console.log(`Provider: ${process.env.IG_PROVIDER}`);
    console.log(`Total endpoints: ${results.length}`);
    console.log(
        `Status codes: ${Object.entries(statusCounts)
            .map(([status, count]) => `${status}=${count}`)
            .join(", ")}`
    );
    console.log(`Failed endpoints: ${failed.length}`);

    if (failed.length > 0) {
        for (const result of failed) {
            console.log(`- ${result.statusCode} ${result.endpoint} ${result.bodyPreview}`);
        }
    }
}

const { createApp } = await import("../src/app.js");
const { server, baseUrl } = await startServer(createApp());

try {
    const results = [];
    for (const endpoint of endpoints) {
        results.push(await requestEndpoint(baseUrl, endpoint));
    }

    printSummary(results);

    if (results.some((result) => !result.ok)) {
        process.exitCode = 1;
    }
} finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
}
