"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Exception {
    constructor(message) {
        this.message = message;
    }
    static createFrom(e) {
        if (e instanceof Exception)
            return e;
        else
            return new GenericException({ cause: e });
    }
}
exports.Exception = Exception;
class GenericException extends Exception {
    constructor(desc) {
        super(desc.message || "Generic Exception");
        this.desc = desc;
        this.desc.message = this.message;
    }
    get cause() { return this.desc.cause; }
}
exports.GenericException = GenericException;
class NoSuchElementException extends Exception {
    constructor(desc) {
        super(desc.message);
        this.desc = desc;
    }
    get message() { return this.desc.message; }
}
exports.NoSuchElementException = NoSuchElementException;
class TimeOutException extends Exception {
    constructor(message) {
        super(message);
    }
}
exports.TimeOutException = TimeOutException;
//# sourceMappingURL=Exception.js.map