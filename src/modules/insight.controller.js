import { sendSuccess } from "../utils/response.js";
import { getProviderContext } from "./controller.helpers.js";

export function insightsController() {
    return async (req, res) => {
        const { provider, meta } = getProviderContext(req);
        const data = await provider.getInsights(req.query);
        return sendSuccess(res, data, { meta });
    };
}
