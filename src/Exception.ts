


export type ExceptionDesc = {
    message : string
}

export class Exception {
    constructor(public message:string){}

    static createFrom(e:any) : Exception {
        if(e instanceof Exception) return e;
        else return new GenericException({ cause : e })
    }
}

export type DefaultExceptionDesc = {
    message ?: string
    cause : any
}

export class GenericException extends Exception {
    constructor(protected desc:DefaultExceptionDesc){
        super(desc.message || "Generic Exception");
        this.desc.message = this.message;
    }

    get cause() : any { return this.desc.cause; }
}

export class NoSuchElementException extends Exception {
    constructor(protected desc : ExceptionDesc){ super(desc.message); }
    get message() : any { return this.desc.message; }
}


export class TimeOutException extends Exception {
    constructor(message:string) {
        super(message);
        // this.name = FutureNotYetStartedException.name;
    }
}