const format = value => {
    const pad = s => (s < 10 ? '0' : '') + s;
    let hours = Math.floor(value / (60*60));
    let minutes = Math.floor(value % (60*60) / 60);
    let seconds = Math.floor(value % 60);

    return pad(hours) + ':' + pad(minutes) + ':' + pad(seconds);
};

let uptime = () => {
    return format(process.uptime());
}

const fmtMs = (v) => v[0] * 1000 + v[1] / 1e6 // ms
const fmtPrc = (v, n = 0) => fmtMs(v).toFixed(n) // ms
const hrt = (v) => process.hrtime(v)


module.exports = {
    uptime,
    fmtPrc,
    hrt
}