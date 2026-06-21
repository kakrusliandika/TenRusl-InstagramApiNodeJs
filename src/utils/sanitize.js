export function sanitizeText(value, { maxLength = 500 } = {}) {
    if (value === undefined || value === null) return value;
    return String(value)
        .replace(/[\u0000-\u001F\u007F]/g, "")
        .trim()
        .slice(0, maxLength);
}

export function sanitizeObject(value) {
    if (Array.isArray(value)) return value.map((item) => sanitizeObject(item));
    if (value && typeof value === "object") {
        return Object.fromEntries(
            Object.entries(value).map(([key, inner]) => [sanitizeText(key, { maxLength: 80 }), sanitizeObject(inner)])
        );
    }
    if (typeof value === "string") return sanitizeText(value);
    return value;
}
