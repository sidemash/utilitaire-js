import { Option } from "./Option";
import { Future } from "./Future";
import { unsafeCast } from "./TypeUtil";
import { Exception, NoSuchElementException } from "./Exception";
export class Try {
    static safeApply(fn) {
        try {
            const value = fn();
            return Try.successful(value);
        }
        catch (error) {
            return Try.failed(Exception.createFrom(error));
        }
    }
    static safeApplyTry(fn) {
        try {
            return fn();
        }
        catch (error) {
            return Try.failed(Exception.createFrom(error));
        }
    }
    static of(fn) {
        return Try.safeApply(() => fn());
    }
    static failed(exception) {
        return new Failure(exception);
    }
    static successful(value) {
        return new Success(value);
    }
    isSuccess() {
        return (this._value != undefined);
    }
    isFailure() {
        return !this.isSuccess();
    }
    valueOrElse(fn) {
        if (this.isSuccess())
            return this._value;
        else
            return fn();
    }
    valueOrNull() {
        if (this.isSuccess())
            return this._value;
        else
            return null;
    }
    value() {
        if (this.isSuccess())
            return this._value;
        else
            throw this._exception;
    }
    exception() {
        if (this.isFailure())
            return this._exception;
        else
            throw new Exception("Attempting to get an exception for a successful Try");
    }
    exceptionOrElse(other) {
        if (this.isFailure())
            return this._exception;
        else
            return other;
    }
    exceptionOrNull() {
        if (this.isFailure())
            return this._exception;
        else
            return null;
    }
    toOption() {
        if (this.isSuccess())
            return Option.of(this._value);
        else
            return Option.empty();
    }
    toFuture() {
        return Future.fromTry(this);
    }
    forEach(fn) {
        if (this.isSuccess())
            fn(this._value);
    }
    map(fn) {
        if (this.isSuccess())
            return Try.of(() => fn(this._value));
        else {
            return this;
        }
    }
    select(fn) { return this.filter(fn); }
    filter(fn) {
        if (this.isFailure())
            return this;
        else {
            Try.safeApplyTry(() => {
                if (fn(this._value))
                    return this;
                else {
                    return Try.failed(new NoSuchElementException({
                        message: "No such element exception: the value '" + this._value +
                            "' did not match the predicate in on the filter method you have previously called"
                    }));
                }
            });
        }
    }
    recover(fn) {
        if (this.isSuccess())
            return this;
        else if (this.isFailure())
            return Try.of(() => fn(this._exception));
    }
    flatRecover(fn) {
        if (this.isSuccess())
            return this;
        else if (this.isFailure())
            return Try.safeApplyTry(() => fn(this._exception));
    }
    flatMap(fn) {
        if (this.isSuccess())
            return Try.safeApplyTry(() => fn(this._value));
        else if (this.isFailure())
            return unsafeCast(this);
    }
    transform(trans) {
        if (this.isSuccess())
            return Try.safeApplyTry(() => trans.ifSuccess(this._value));
        else
            return Try.safeApplyTry(() => trans.ifFailure(this._exception));
    }
    fold(fold) {
        if (this.isSuccess())
            return fold.ifSuccess(this._value);
        else
            return fold.ifFailure(this._exception);
    }
}
class Success extends Try {
    constructor(value) {
        super();
        this._value = value;
    }
}
class Failure extends Try {
    constructor(exception) {
        super();
        this._exception = exception;
    }
}
//# sourceMappingURL=Try.js.map