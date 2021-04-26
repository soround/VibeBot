require('dotenv').config()

const {VK} = require('vk-io');
const {onEnter, useMessage, Commander} = require('./core');
const {RateLimiter} = require('./midllewares')

const {video, times} = require('./utils/index')
const {JSONStorage} = require('./db')


const jsonStorage = new JSONStorage(
    process.env.STORAGE_FILE || '',
    {
        syncOnWrite: true,
        jsonSpaces: 4
    }
)

const vk = new VK({
    token: process.env.ACCESS_TOKEN,
    pollingGroupId: process.env.GROUP_ID
});

const commander = new Commander();
const rateLimiter = new RateLimiter({
    maxPerSecond: parseInt(process.env.MAX_PER_SECONDS) || 1,
    onLimitExceeded: (ctx) => {
        if (ctx.isChat) return;
        ctx.send(`Частота вызова ограничена`)
    }
})

vk.updates.on('message', rateLimiter.middleware);
vk.updates.on('message', commander.middleware);


commander.addCommand({
    name: 'vibe',
    pattern: /^\/vibe (\d+)$/,
    setup() {
        const {send, text, peerId} = useMessage();

        onEnter(async () => {
            const bpm = text.value.match(this.pattern)[1]
            if (parseInt(bpm) < parseInt(process.env.MIN_BPM) || parseInt(bpm) > parseInt(process.env.MAX_BPM)) {
                await send(`BPM должен быть в пределах от ${process.env.MIN_BPM} до ${process.env.MAX_BPM}`)
                return;
            }
            
            if (!jsonStorage.has(bpm)) {
                let file = await video.makeVideo(bpm, `./data/output/cat_${bpm}.gif`)
                let document = await vk.upload.messageDocument({
                    source: {
                        timeout: 10e3 * 8,
                        value: file,
                        filename: `cat_jam${bpm}bpm_vibebot.gif`
                    },
                    peer_id: peerId.value,
                    title: `cat_jam${bpm}bpm@vibebot.gif`,
                    tags: 'cat',
                })

                jsonStorage.set(bpm, {
                    filePath: file,
                    attachment: String(document)
                })
            }

            let result = jsonStorage.get(bpm)

            await send({
                message: `Текущий bmp: ${bpm}`,
                attachment: result.attachment
            })
        });
    }
})

commander.addCommand({
    name: 'uptime',
    pattern: /uptime$/,
    setup() {
        const {send} = useMessage();

        onEnter(async () => {
            await send(`Uptime: ${times.uptime()}`)
        });
    }
})


vk.updates.start()
    .then(() => {
        console.log('Bot started');
    })
    .catch(console.error);
