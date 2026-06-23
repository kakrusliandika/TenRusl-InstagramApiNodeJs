export const INSTAGRAM_PROVIDER_METHODS = Object.freeze([
    "getAccount",
    "getProfile",
    "getProfileByLink",
    "getFollowers",
    "getFollowing",
    "performAction",
    "getUserCollection",
    "getByLink",
    "getPostById",
    "publish",
    "getComments",
    "replyComment",
    "getMentions",
    "getHashtagMedia",
    "getInsights",
    "getConversations",
    "getMessages",
    "getMessageThread",
    "sendMessage",
]);

export const INSTAGRAM_PROVIDER_CONTRACT = Object.freeze({
    status: "Return provider readiness, name, and capability metadata.",
    getAccount: "Read account details by id or username.",
    getProfile: "Read profile details by id or username.",
    getProfileByLink: "Read profile details from a parsed Instagram profile link.",
    getFollowers: "Read follower collection for an account identifier.",
    getFollowing: "Read following collection for an account identifier.",
    performAction: "Handle safe action contracts such as follow and unfollow.",
    getUserCollection: "Read user media collection by resource type.",
    getByLink: "Read resource details from a parsed Instagram media link.",
    getPostById: "Read post details by provider post id.",
    publish: "Handle safe publish contracts.",
    getComments: "Read comments for optional target link and pagination.",
    replyComment: "Handle safe comment reply contracts.",
    getMentions: "Read mentions collection.",
    getHashtagMedia: "Read hashtag media collection.",
    getInsights: "Read provider-specific insights.",
    getConversations: "Read conversation collection.",
    getMessages: "Read message collection.",
    getMessageThread: "Read messages for a thread id.",
    sendMessage: "Handle safe message send contracts.",
});

export function assertInstagramProviderContract(provider) {
    const missing = ["status", ...INSTAGRAM_PROVIDER_METHODS].filter((method) => typeof provider?.[method] !== "function");
    if (missing.length > 0) {
        throw new TypeError(`Instagram provider contract violation: missing ${missing.join(", ")}.`);
    }
    return provider;
}
