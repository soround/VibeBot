let currentInstance;
const setCurrentInstance = (instance) => {
    currentInstance = instance;
};

/**
 * @return {{
 *  message: import('vk-io').MessageContext
 * }}
 */
const getCurrentInstance = () => currentInstance;

const onChangeHooksSymbol = Symbol('onChangeHooks');

const ref = (defaultValue) => {
    /**
     * @type {{ value: any }}
     */
    const internalRef = {
        [onChangeHooksSymbol]: []
    };

    let internalValue = defaultValue;
    Object.defineProperty(internalRef, 'value', {
        get: () => internalValue,
        set: (val) => {
            internalValue = val;

            for (const hook of internalRef[onChangeHooksSymbol]) {
                hook();
            }
        }
    });

    return internalRef;
};

const watch = (refLink, callback) => {
    refLink[onChangeHooksSymbol].push(callback);
};

const onEnter = (callback) => {
    const instance = getCurrentInstance();
    instance.hooks.onEnter.push(callback);
};

const onLeave = (callback) => {
    const instance = getCurrentInstance();
    instance.hooks.onLeave.push(callback);
};

const useMessage = () => {
    const instance = getCurrentInstance();

    const senderId = ref(instance.message.senderId);
    const peerId = ref(instance.message.peerId);
    const text = ref(instance.message.text);
    const send = instance.message.send.bind(instance.message);
    const sendDocuments = instance.message.sendDocuments.bind(instance.message);

    return {send, senderId, peerId, text, sendDocuments};
};

class Commander {
    commands = [];

    /**
     * @param{{name: string, pattern: RegExp, setup(): void}} command - Основной объкт комманды
     * @param{string} command.name - Имя комманды
     * @param{RegExp} command.pattern - Триггер команды
     * @param {function} command.setup - Основная логика комманды
     */
    addCommand(command) {
        this.commands.push(command);
    }

    get middleware() {
        return async (context) => {
            const command = this.commands.find(item => (
                item.pattern.test(context.text)
            ));

            if (!command) {
                if (context.isChat) {
                    return;
                }
                await context.send('Command not found');
                return;
            }


            const instance = {
                message: context,
                hooks: {
                    onEnter: [],
                    onLeave: []
                }
            };

            setCurrentInstance(instance);
            command.setup();

            for (const hook of instance.hooks.onEnter) {
                await hook();
            }

            for (const hook of instance.hooks.onLeave) {
                await hook();
            }

            setCurrentInstance(undefined);
        };
    }
}

module.exports = {
    getCurrentInstance,
    setCurrentInstance,
    ref,
    watch,
    onEnter,
    onLeave,
    useMessage,
    Commander
};