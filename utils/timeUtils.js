const fmtMs = (v) => v[0] * 1000 + v[1] / 1e6 // ms
const fmtPrc = (v, n = 0) => fmtMs(v).toFixed(n) // ms
const hrt = (v) => process.hrtime(v)

let formatDuration = (rawMs) => {
    const ms = Math.abs(rawMs);

    const time = {
        day: Math.floor(ms / 86400000),
        hour: Math.floor(ms / 3600000) % 24,
        minute: Math.floor(ms / 60000) % 60,
        second: Math.floor(ms / 1000) % 60,
        millisecond: Math.floor(ms) % 1000
    };

    return Object.entries(time)
        .filter(val => val[1] !== 0)
        .map(([key, val]) => `${val} ${key}${val !== 1 ? 's' : ''}`)
        .join(', ');
}


module.exports = {
    formatDuration,
    fmtPrc,
    hrt
}