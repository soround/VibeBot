const fs = require('fs')
const {spawn} = require('child_process')

const { fmtPrc, hrt } = require('./timeUtils')

// https://github.com/Loskir/cat-vibes-bot/blob/master/functions/main.js#L16
const makeVideo = (bpm, outPath) => new Promise(async (resolve) => {

    if (fs.existsSync(outPath)) {
        resolve(outPath)
        return;
    }

    console.log(`${bpm}: starting ffmpeg`)
    const ffmpegStart = hrt()
    // ffmpeg -y -i data/cat.mp4 -filter:v "setpts=0.41*PTS,fps=30,scale=480:-1:flags=lanczos" cat.gif
    const ls = spawn('ffmpeg', [
        '-y', '-i', './data/cat.mp4', '-loglevel', '0',
        '-filter:v', `setpts=${123 / bpm}*PTS,fps=50,scale=480:-1:flags=lanczos`,
        outPath,
    ])
    ls.once('close', (code) => {
        console.log(`${bpm}: ffmpeg finished with code ${code} in ${fmtPrc(hrt(ffmpegStart))}ms`)
        resolve(outPath)
    })
})


module.exports = {
    makeVideo
}