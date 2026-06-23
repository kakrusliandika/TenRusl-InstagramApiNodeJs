import { sendSuccess } from "../utils/response.js";
import { validateId, validateMessageBody, validatePagination } from "../utils/validation.js";
import { getProviderContext } from "./controller.helpers.js";

export function conversationsController() {
    return async (req, res) => {
        const query = validatePagination(req.query);
        const { provider, meta } = getProviderContext(req, { pagination: query });
        const data = await provider.getConversations(query);
        return sendSuccess(res, data, { meta });
    };
}

export function messagesController() {
    return async (req, res) => {
        const query = validatePagination(req.query);
        const { provider, meta } = getProviderContext(req, { pagination: query });
        const data = await provider.getMessages(query);
        return sendSuccess(res, data, { meta });
    };
}

export function messageThreadController() {
    return async (req, res) => {
        const id = validateId(req.params.id);
        const query = validatePagination(req.query);
        const { provider, meta } = getProviderContext(req, { id, pagination: query });
        const data = await provider.getMessageThread(id, query);
        return sendSuccess(res, data, { meta });
    };
}

export function sendMessageController() {
    return async (req, res) => {
        const id = validateId(req.params.id);
        const body = validateMessageBody(req.body);
        const { provider, meta } = getProviderContext(req, { id, dryRun: true });
        const data = await provider.sendMessage(id, body);
        return sendSuccess(res, data, { statusCode: 202, meta });
    };
}
