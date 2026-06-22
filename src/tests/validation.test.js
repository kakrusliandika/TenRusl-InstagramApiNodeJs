import test from "node:test";
import assert from "node:assert/strict";
import { assertEnvelope, requestJson, withServer } from "./test-client.js";

test("invalid username returns standard error envelope", async () => {
    await withServer(async ({ baseUrl }) => {
        const { response, body } = await requestJson(baseUrl, "/v1/get/profiles/bad..username");
        assert.equal(response.status, 400);
        assertEnvelope(body, false);
        assert.equal(body.error.code, "USERNAME_INVALID");
    });
});

test("invalid post link returns standard error envelope", async () => {
    await withServer(async ({ baseUrl }) => {
        const { response, body } = await requestJson(
            baseUrl,
            "/v1/get/posts/by-link?link=https%3A%2F%2Fexample.com%2Fp%2FABC%2F"
        );
        assert.equal(response.status, 400);
        assertEnvelope(body, false);
        assert.equal(body.error.code, "INSTAGRAM_LINK_INVALID");
    });
});

test("invalid pagination query returns validation error envelope", async () => {
    await withServer(async ({ baseUrl }) => {
        const { response, body } = await requestJson(baseUrl, "/v1/get/followers/tenrusl?limit=not-a-number");
        assert.equal(response.status, 400);
        assertEnvelope(body, false);
        assert.equal(body.error.code, "VALIDATION_ERROR");
        assert.ok(body.error.details.fieldErrors.limit);
    });
});

test("invalid publish body returns validation error envelope", async () => {
    await withServer(async ({ baseUrl }) => {
        const { response, body } = await requestJson(baseUrl, "/v1/publish/media", {
            method: "POST",
            body: JSON.stringify({ mediaType: "IMAGE", caption: "missing mediaUrl" }),
        });
        assert.equal(response.status, 400);
        assertEnvelope(body, false);
        assert.equal(body.error.code, "VALIDATION_ERROR");
        assert.ok(body.error.details.fieldErrors.mediaUrl);
    });
});

test("comment reply without id or link returns validation error envelope", async () => {
    await withServer(async ({ baseUrl }) => {
        const { response, body } = await requestJson(baseUrl, "/v1/comments/reply", {
            method: "POST",
            body: JSON.stringify({ text: "Missing reply target" }),
        });
        assert.equal(response.status, 400);
        assertEnvelope(body, false);
        assert.equal(body.error.code, "VALIDATION_ERROR");
        assert.deepEqual(body.error.details.formErrors, ["id or link is required."]);
    });
});

test("comment reply with invalid link returns Instagram link validation error", async () => {
    await withServer(async ({ baseUrl }) => {
        const { response, body } = await requestJson(baseUrl, "/v1/comments/reply", {
            method: "POST",
            body: JSON.stringify({ link: "https://example.com/p/ABC/", text: "Invalid link" }),
        });
        assert.equal(response.status, 400);
        assertEnvelope(body, false);
        assert.equal(body.error.code, "INSTAGRAM_LINK_INVALID");
        assert.match(body.error.message, /instagram\.com/);
    });
});

test("error response format is consistent for not found route", async () => {
    await withServer(async ({ baseUrl }) => {
        const { response, body } = await requestJson(baseUrl, "/v1/unknown-route");
        assert.equal(response.status, 404);
        assertEnvelope(body, false);
        assert.equal(body.data, null);
        assert.ok(body.error.message);
    });
});
