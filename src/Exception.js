export class Exception {
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
export class GenericException extends Exception {
    constructor(desc) {
        super(desc.message || "Generic Exception");
        this.desc = desc;
        this.desc.message = this.message;
    }
    get cause() { return this.desc.cause; }
}
export class NoSuchElementException extends Exception {
    constructor(desc) {
        super(desc.message);
        this.desc = desc;
    }
    get message() { return this.desc.message; }
}
export class TimeOutException extends Exception {
    constructor(message) {
        super(message);
    }
}
//# sourceMappingURL=Exception.js.map