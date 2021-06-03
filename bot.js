require('dotenv').config()

const {VK} = require('vk-io');
const {onEnter, useMessage, Commander} = require('./core');
const {RateLimitManager} = require('./midllewares');

const {video, times} = require('./utils/index');
const {JSONStorage} = require('./db');


const jsonStorage = new JSONStorage(
    process.env.STORAGE_FILE || '',
    {
        syncOnWrite: true,
        jsonSpaces: 4
    }
);

const vk = new VK({
    token: process.env.ACCESS_TOKEN,
    pollingGroupId: process.env.GROUP_ID
});

const commander = new Commander();
const rateLimitManager = new RateLimitManager({
    waitTime: 3e3,
    messageLimit: parseInt(process.env.MAX_PER_SECONDS) || 1,
    onLimitExceeded: (ctx) => {
        if (ctx.isChat) return;
        ctx.send(`Частота вызова ограничена`);
    }
});


vk.updates.on('message', rateLimitManager.middleware);
vk.updates.on('message', commander.middleware);


commander.addCommand({
    name: 'vibe',
    pattern: /^\/vibe (\d+)$/,
    setup: function () {
        const {send, text, peerId, senderId} = useMessage();
        onEnter(async () => {
            let bpm = text.value.match(this.pattern)[1];
            let minBpm = parseInt(process.env.MIN_BPM);
            let maxBpm = parseInt(process.env.MAX_BPM);

            if (parseInt(bpm) < minBpm || parseInt(bpm) > maxBpm) {
                await send(`BPM должен быть в пределах от ${minBpm} до ${maxBpm}`);
                return;
            }
            if (!jsonStorage.has(bpm)) {
                let file = await video.makeVideo(bpm, `./data/output/cat_${bpm}.gif`);
                let document = await vk.upload.messageDocument({
                    source: {
                        timeout: 10e3 * 8,
                        value: file,
                        filename: `cat_jam${bpm}bpm_vibebot.gif`
                    },
                    peer_id: peerId.value,
                    title: `cat_jam${bpm}bpm@vibebot.gif`,
                    tags: 'cat',
                });

                jsonStorage.set(bpm, {
                    generationDate: new Date().toJSON(),
                    attachment: String(document),
                    count: 0
                });
            }

            let result = jsonStorage.get(bpm)
            result.count = result.count + 1;
            jsonStorage.set(bpm, result)

            let message = `Текущий bmp: ${bpm}`;
            if (process.env.WHITE_IDS.indexOf(senderId.value)) {
                message = `bpm: ${bpm}\nGeneration date: ${new Date(result.generationDate).toLocaleString()}\nUsage count: ${result.count}`;
            }
            await send({
                message: message,
                attachment: result.attachment,
            });
        });
    }
})

commander.addCommand({
    name: 'uptime',
    pattern: /uptime$/,
    setup() {
        const {send} = useMessage();
        onEnter(async () => {
            await send(`Uptime: ${times.formatDuration(process.uptime() * 1000)}`);
        });
    }
})

commander.addCommand({
    name: 'stats',
    pattern: /stats$/,
    setup() {
        const {send} = useMessage();
        onEnter(async () => {
            await send(`Количество attachments в бд: ${Object.getOwnPropertyNames(jsonStorage.JSON()).length}`);
        });
    }
})


vk.updates.start()
    .then(() => {
        console.log('Bot started');
    })
    .catch(console.error);