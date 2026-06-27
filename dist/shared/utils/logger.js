"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const env_1 = require("../config/env");
function formatEntry(level, message, meta) {
    return {
        level,
        message,
        timestamp: new Date().toISOString(),
        ...meta,
    };
}
function write(level, message, meta) {
    const entry = formatEntry(level, message, meta);
    if (env_1.env.NODE_ENV === 'production') {
        // JSON structured output for log aggregators (Datadog, CloudWatch, etc.)
        process.stdout.write(JSON.stringify(entry) + '\n');
    }
    else {
        const colors = {
            debug: '\x1b[36m', // cyan
            info: '\x1b[32m', // green
            warn: '\x1b[33m', // yellow
            error: '\x1b[31m', // red
        };
        const reset = '\x1b[0m';
        const prefix = `${colors[level]}[${level.toUpperCase()}]${reset}`;
        const metaStr = meta ? ' ' + JSON.stringify(meta) : '';
        // eslint-disable-next-line no-console
        console.log(`${entry.timestamp} ${prefix} ${message}${metaStr}`);
    }
}
exports.logger = {
    debug: (message, meta) => {
        if (env_1.env.NODE_ENV !== 'production')
            write('debug', message, meta);
    },
    info: (message, meta) => write('info', message, meta),
    warn: (message, meta) => write('warn', message, meta),
    error: (message, meta) => write('error', message, meta),
};
