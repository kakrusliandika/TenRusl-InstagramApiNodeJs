import crypto from "node:crypto";

export function requestIdMiddleware(req, res, next) {
    const headerValue = req.get("x-request-id");
    req.id = headerValue && headerValue.length <= 100 ? headerValue : crypto.randomUUID();
    res.setHeader("x-request-id", req.id);
    next();
}
