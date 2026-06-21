import { env } from "../config/env.js";

export function normalizePagination(query = {}) {
    const rawLimit = Number.parseInt(query.limit ?? env.defaultLimit, 10);
    const rawPage = Number.parseInt(query.page ?? 1, 10);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), env.maxLimit) : env.defaultLimit;
    const page = Number.isFinite(rawPage) ? Math.max(rawPage, 1) : 1;
    const cursor = query.cursor ? String(query.cursor).trim().slice(0, 256) : null;
    return { limit, page, cursor };
}
