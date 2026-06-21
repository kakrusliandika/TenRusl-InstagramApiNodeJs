import { env } from "./env.js";

const levelRank = { debug: 10, info: 20, warn: 30, error: 40, silent: 100 };
const currentLevel = levelRank[env.logLevel] ?? levelRank.info;

function redact(value) {
    if (!value || typeof value !== "object") return value;
    return JSON.parse(
        JSON.stringify(value, (key, innerValue) => {
            if (/token|secret|password|credential|session|key/i.test(key)) return "[REDACTED]";
            return innerValue;
        })
    );
}

function write(level, message, payload = {}) {
    if ((levelRank[level] ?? levelRank.info) < currentLevel || env.nodeEnv === "test") return;
    const entry = {
        level,
        time: new Date().toISOString(),
        service: "tenrusl-instagram-api",
        message,
        ...redact(payload),
    };
    const line = JSON.stringify(entry);
    if (level === "error") console.error(line);
    else if (level === "warn") console.warn(line);
    else console.log(line);
}

export const logger = Object.freeze({
    debug: (message, payload) => write("debug", message, payload),
    info: (message, payload) => write("info", message, payload),
    warn: (message, payload) => write("warn", message, payload),
    error: (message, payload) => write("error", message, payload),
});
