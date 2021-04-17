const MemoryStore = require('./memoryStore')


class RateLimiter {
    constructor(options) {
        this.config = Object.assign({
            window: 1e3,
            maxPerSecond: 3,
            keyGenerator: (context) => {
                return context && context.peerId
            },
            onLimitExceeded: () => {}
        }, options)
    }

    get middleware() {
        const store = new MemoryStore(this.config.window)
        return async (ctx, next) => {
            const key = this.config.keyGenerator(ctx)
            if (!key) {
                return next()
            }
            const hit = store.increment(key)
            return hit <= this.config.maxPerSecond ? next() : this.config.onLimitExceeded(ctx, next)
        }
    }
}


module.exports = { RateLimiter }