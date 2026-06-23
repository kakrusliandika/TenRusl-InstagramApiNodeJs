import { sendSuccess } from "../utils/response.js";
import { validateIdentifier } from "../utils/validation.js";
import { getProviderContext } from "./controller.helpers.js";

export function accountController() {
    return async (req, res) => {
        const identifier = validateIdentifier(req.params.identifier);
        const { provider, meta } = getProviderContext(req, { identifier });
        const data = await provider.getAccount(identifier.value);
        return sendSuccess(res, data, { meta });
    };
}
