import { sendSuccess } from "../utils/response.js";
import { validateIdentifier, validateLinkQuery } from "../utils/validation.js";
import { getProviderContext } from "./controller.helpers.js";

export function profileController() {
    return async (req, res) => {
        const identifier = validateIdentifier(req.params.identifier);
        const { provider, meta } = getProviderContext(req, { identifier });
        const data = await provider.getProfile(identifier.value);
        return sendSuccess(res, data, { meta });
    };
}

export function profileByLinkController() {
    return async (req, res) => {
        const parsedLink = validateLinkQuery(req.query, { allowProfile: true });
        const { provider, meta } = getProviderContext(req, { link: parsedLink });
        const data = await provider.getProfileByLink(parsedLink);
        return sendSuccess(res, data, { meta });
    };
}
