import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import * as gatewayControllers from "../modules/gateway.controller.js";
import { INSTAGRAM_PROVIDER_METHODS } from "../providers/instagram/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const v1RoutesPath = join(__dirname, "..", "routes", "v1.routes.js");
const v1RoutesTestPath = join(__dirname, "v1-routes.test.js");

const gatewayContract = Object.freeze([
    {
        providerMethod: "getAccount",
        controller: "accountController",
        canonicalRoutes: ["/get/accounts/:identifier"],
        testRoutes: ["/v1/get/accounts/tenrusl"],
    },
    {
        providerMethod: "getProfile",
        controller: "profileController",
        canonicalRoutes: ["/get/profiles/:identifier"],
        testRoutes: ["/v1/get/profiles/tenrusl"],
    },
    {
        providerMethod: "getProfileByLink",
        controller: "profileByLinkController",
        canonicalRoutes: ["/get/profiles/by-link"],
        testRoutes: ["/v1/get/profiles/by-link"],
    },
    {
        providerMethod: "getFollowers",
        controller: "relationController",
        canonicalRoutes: ["/get/followers/:identifier"],
        testRoutes: ["/v1/get/followers/tenrusl"],
    },
    {
        providerMethod: "getFollowing",
        controller: "relationController",
        canonicalRoutes: ["/get/following/:identifier"],
        testRoutes: ["/v1/get/following/123456"],
    },
    {
        providerMethod: "performAction",
        controller: "actionController",
        canonicalRoutes: ["/actions/follow/:identifier", "/actions/unfollow/:identifier"],
        testRoutes: ["/v1/actions/follow/tenrusl", "/v1/actions/unfollow/123456"],
    },
    {
        providerMethod: "getUserCollection",
        controller: "userCollectionController",
        canonicalRoutes: [
            "/get/photos/users/:identifier",
            "/get/feeds/users/:identifier",
            "/get/statuses/users/:identifier",
            "/get/posts/users/:identifier",
            "/get/reels/users/:identifier",
            "/get/media/users/:identifier",
        ],
        testRoutes: [
            "/v1/get/photos/users/tenrusl",
            "/v1/get/feeds/users/123456",
            "/v1/get/statuses/users/tenrusl",
            "/v1/get/posts/users/tenrusl",
            "/v1/get/reels/users/tenrusl",
            "/v1/get/media/users/tenrusl",
        ],
    },
    {
        providerMethod: "getByLink",
        controller: "linkCollectionController",
        canonicalRoutes: [
            "/get/photos/by-link",
            "/get/feeds/by-link",
            "/get/statuses/by-link",
            "/get/posts/by-link",
            "/get/reels/by-link",
            "/get/media/by-link",
        ],
        testRoutes: [
            "/v1/get/photos/by-link",
            "/v1/get/feeds/by-link",
            "/v1/get/statuses/by-link",
            "/v1/get/posts/by-link",
            "/v1/get/reels/by-link",
            "/v1/get/media/by-link",
        ],
    },
    {
        providerMethod: "getPostById",
        controller: "postDetailController",
        canonicalRoutes: ["/get/posts/:id"],
        testRoutes: ["/v1/get/posts/post_123"],
    },
    {
        providerMethod: "publish",
        controller: "publishController",
        canonicalRoutes: ["/publish/media", "/publish/reels", "/publish/photos", "/publish/feeds", "/publish/statuses"],
        testRoutes: [
            "/v1/publish/media",
            "/v1/publish/reels",
            "/v1/publish/photos",
            "/v1/publish/feeds",
            "/v1/publish/statuses",
        ],
    },
    {
        providerMethod: "getComments",
        controller: "commentsController",
        canonicalRoutes: ["/comments"],
        testRoutes: ["/v1/comments"],
    },
    {
        providerMethod: "replyComment",
        controller: "replyCommentController",
        canonicalRoutes: ["/comments/reply", "/comments/:id/reply"],
        testRoutes: ["/v1/comments/reply", "/v1/comments/comment_123/reply"],
    },
    {
        providerMethod: "getMentions",
        controller: "mentionsController",
        canonicalRoutes: ["/mentions"],
        testRoutes: ["/v1/mentions"],
    },
    {
        providerMethod: "getHashtagMedia",
        controller: "hashtagMediaController",
        canonicalRoutes: ["/hashtags/media"],
        testRoutes: ["/v1/hashtags/media"],
    },
    {
        providerMethod: "getInsights",
        controller: "insightsController",
        canonicalRoutes: ["/insights"],
        testRoutes: ["/v1/insights"],
    },
    {
        providerMethod: "getConversations",
        controller: "conversationsController",
        canonicalRoutes: ["/conversations"],
        testRoutes: ["/v1/conversations"],
    },
    {
        providerMethod: "getMessages",
        controller: "messagesController",
        canonicalRoutes: ["/messages"],
        testRoutes: ["/v1/messages"],
    },
    {
        providerMethod: "getMessageThread",
        controller: "messageThreadController",
        canonicalRoutes: ["/messages/:id"],
        testRoutes: ["/v1/messages/thread_123"],
    },
    {
        providerMethod: "sendMessage",
        controller: "sendMessageController",
        canonicalRoutes: ["/messages/:id/send"],
        testRoutes: ["/v1/messages/thread_123/send"],
    },
]);

function unique(values) {
    return [...new Set(values)];
}

test("gateway contract covers every provider method exactly once", () => {
    const contractMethods = gatewayContract.map(({ providerMethod }) => providerMethod).sort();

    assert.deepEqual(contractMethods, [...INSTAGRAM_PROVIDER_METHODS].sort());
});

test("gateway contract covers every exported controller factory", () => {
    const contractControllers = unique(gatewayContract.map(({ controller }) => controller)).sort();
    const exportedControllers = Object.entries(gatewayControllers)
        .filter(([, value]) => typeof value === "function")
        .map(([name]) => name)
        .sort();

    assert.deepEqual(exportedControllers, contractControllers);
});

test("gateway contract controller factories are wired into v1 router", async () => {
    const v1RoutesSource = await readFile(v1RoutesPath, "utf8");

    for (const { controller } of gatewayContract) {
        assert.match(
            v1RoutesSource,
            new RegExp(`\\b${controller}\\b`),
            `${controller} is imported and used by v1 router`
        );
    }

    for (const { canonicalRoutes } of gatewayContract) {
        for (const route of canonicalRoutes) {
            const routeTemplates = [
                route,
                route
                    .replace("/get/photos/", "/get/${resource}/")
                    .replace("/get/feeds/", "/get/${resource}/")
                    .replace("/get/statuses/", "/get/${resource}/")
                    .replace("/get/posts/", "/get/${resource}/")
                    .replace("/get/reels/", "/get/${resource}/")
                    .replace("/get/media/", "/get/${resource}/"),
                route
                    .replace("/publish/photos", "/publish/${resource}")
                    .replace("/publish/feeds", "/publish/${resource}")
                    .replace("/publish/statuses", "/publish/${resource}")
                    .replace("/publish/reels", "/publish/${resource}")
                    .replace("/publish/media", "/publish/${resource}"),
            ];

            assert.ok(
                routeTemplates.some((candidate) => v1RoutesSource.includes(candidate)),
                `${route} is registered by v1 router`
            );
        }
    }
});

test("gateway contract canonical routes are covered by route envelope tests", async () => {
    const routeTestSource = await readFile(v1RoutesTestPath, "utf8");

    for (const { testRoutes } of gatewayContract) {
        for (const route of testRoutes) {
            assert.ok(routeTestSource.includes(route), `${route} is listed in v1 route envelope tests`);
        }
    }
});
