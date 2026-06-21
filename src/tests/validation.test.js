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

test("error response format is consistent for not found route", async () => {
    await withServer(async ({ baseUrl }) => {
        const { response, body } = await requestJson(baseUrl, "/v1/unknown-route");
        assert.equal(response.status, 404);
        assertEnvelope(body, false);
        assert.equal(body.data, null);
        assert.ok(body.error.message);
    });
});
