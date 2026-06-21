import assert from "node:assert/strict";
import { createApp } from "../app.js";

export async function withServer(testFn) {
    const app = createApp();
    const server = app.listen(0);
    await new Promise((resolve) => server.once("listening", resolve));
    const { port } = server.address();
    const baseUrl = `http://127.0.0.1:${port}`;

    try {
        await testFn({ baseUrl });
    } finally {
        await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    }
}

export async function requestJson(baseUrl, path, options = {}) {
    const response = await fetch(`${baseUrl}${path}`, {
        ...options,
        headers: {
            "content-type": "application/json",
            ...(options.headers || {}),
        },
    });
    const contentType = response.headers.get("content-type") || "";
    const body = contentType.includes("application/json") ? await response.json() : await response.text();
    return { response, body };
}

export function assertEnvelope(body, success = true) {
    assert.equal(body.success, success);
    assert.ok(Object.hasOwn(body, "data"));
    assert.ok(Object.hasOwn(body, "meta"));
    assert.ok(Object.hasOwn(body, "error"));
}
