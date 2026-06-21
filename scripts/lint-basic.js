import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const roots = ["src", "scripts"];
const files = [];
const forbiddenPatterns = [
    [/password\s*[:=]\s*['"]/i, "Hardcoded password-like assignment"],
    [/access_token\s*[:=]\s*['"][A-Za-z0-9._-]{20,}/i, "Hardcoded access token"],
    [/credential stuffing/i, "Unsafe credential-stuffing wording in code"],
    [/bypass login/i, "Unsafe bypass-login wording in code"],
];

function walk(dir) {
    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        const stat = statSync(full);
        if (stat.isDirectory()) walk(full);
        if (stat.isFile() && full.endsWith(".js") && !full.endsWith("lint-basic.js")) files.push(full);
    }
}

for (const root of roots) walk(root);

let failed = false;
for (const file of files) {
    const content = readFileSync(file, "utf8");
    for (const [pattern, message] of forbiddenPatterns) {
        if (pattern.test(content)) {
            console.error(`❌ ${message}: ${file}`);
            failed = true;
        }
    }
}

if (failed) process.exit(1);
console.log(`Basic lint OK: ${files.length} JavaScript files scanned.`);
