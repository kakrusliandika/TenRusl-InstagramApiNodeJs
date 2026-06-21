import { AppError, ERROR_CODES } from "../utils/errors.js";

export function validateWith(schema, selector = (req) => req.body) {
    return function validationMiddleware(req, _res, next) {
        const parsed = schema.safeParse(selector(req));
        if (!parsed.success) {
            return next(
                new AppError("Request validation failed.", {
                    statusCode: 400,
                    code: ERROR_CODES.VALIDATION_ERROR,
                    details: parsed.error.flatten(),
                })
            );
        }
        req.validated = parsed.data;
        return next();
    };
}
