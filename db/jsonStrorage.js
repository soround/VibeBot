const fs = require('fs')


let validateJSON = (value) => {
    try {
        JSON.parse(value);
    } catch (e) {
        return false;
    }
    return true;
}


class JSONStorage {

    constructor(filePath, options) {
        if (!filePath || !filePath.length) {
            throw new Error('Missing file path argument.');
        }
        this.options = Object.assign({
            asyncWrite: false,
            syncOnWrite: true,
            jsonSpaces: 4
        }, options)

        this.filePath = filePath;
        this.storage = {}

        let stats;
        try {
            stats = fs.statSync(this.filePath)
        } catch (e) {
            if (e.code === 'ENOENT') {
                return;
            } else if (e.code === 'EACCES') {
                throw new Error(`Cannot access path "${filePath}".`);
            } else {
                throw new Error(`Error while checking for existence of path "${filePath}": ${e}`);
            }
        }
        try {
            fs.accessSync(filePath, fs.constants.R_OK | fs.constants.W_OK);
        } catch (err) {
            throw new Error(`Cannot read & write on path "${filePath}"`);
        }
        if (stats.size > 0) {
            let data;
            try {
                data = fs.readFileSync(filePath);
            } catch (err) {
                throw err;
            }
            if (!validateJSON(data)) {
                return;
            }
            this.storage = JSON.parse(data);
        }
    }

    sync() {
        if (this.options) {
            if (this.options && this.options.asyncWrite) {
                fs.writeFile(this.filePath, JSON.stringify(this.storage, null, this.options.jsonSpaces), (err) => {
                    if (err) throw err;
                });
            } else {
                try {
                    fs.writeFileSync(this.filePath, JSON.stringify(this.storage, null, this.options.jsonSpaces));
                } catch (err) {
                    if (err.code === 'EACCES') {
                        throw new Error(`Cannot access path "${this.filePath}".`);
                    } else {
                        throw new Error(`Error while writing to path "${this.filePath}": ${err}`);
                    }
                }
            }
        } else {
            try {
                fs.writeFileSync(this.filePath, JSON.stringify(this.storage, null, this.options.jsonSpaces));
            } catch (err) {
                if (err.code === 'EACCES') {
                    throw new Error(`Cannot access path "${this.filePath}".`);
                } else {
                    throw new Error(`Error while writing to path "${this.filePath}": ${err}`);
                }
            }
        }
    }

    set(key, value) {
        this.storage[key] = value;
        if (this.options && this.options.syncOnWrite) this.sync();
    }

    has(key) {
        return this.storage.hasOwnProperty(key);
    }

    get(key) {
        return this.has(key) ? this.storage[key] : undefined;
    }

    delete(key) {
        let retVal = this.storage.hasOwnProperty(key) ? delete this.storage[key] : undefined;
        if (this.options && this.options.syncOnWrite) this.sync();
        return retVal;
    }

    deleteAll() {
        for (let key in this.storage) {
            if (this.storage.hasOwnProperty(key)) {
                this.delete(key);
            }
        }
        return this;
    }

    toString() {
        return JSON.stringify(this.storage, null, this.options.jsonSpaces)
    }

    JSON(storage) {
        if (storage) {
            try {
                JSON.parse(JSON.stringify(storage));
                this.storage = storage;
            } catch (err) {
                throw new Error(err);
            }
        }
        return JSON.parse(JSON.stringify(this.storage));
    }
}


module.exports = {
    JSONStorage
}