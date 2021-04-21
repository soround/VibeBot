const MemoryStore = require('./memoryStore')


class RateLimiter {
    constructor(options) {
        this.config = Object.assign({
            waitTime: 1e3,
            maxPerSecond: 3,
            keyGenerator: (context) => {
                return context && context.peerId
            },
            onLimitExceeded: () => {}
        }, options)
    }

    get middleware() {
        const store = new MemoryStore(this.config.waitTime)
        return async (ctx, next) => {
            const key = this.config.keyGenerator(ctx)
            if (!key) {
                return next()
            }
            const hit = store.increment(key)
            if (hit <= this.config.maxPerSecond) {
                return next()
            } else {
                return this.config.onLimitExceeded(ctx, next)
            }
        }
    }
}


module.exports = { RateLimiter }