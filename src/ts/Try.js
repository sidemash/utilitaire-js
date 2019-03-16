"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Option_1 = require("./Option");
const Future_1 = require("./Future");
const TypeUtil_1 = require("./TypeUtil");
const Exception_1 = require("./Exception");
class Try {
    static safeApply(fn) {
        try {
            const value = fn();
            return Try.successful(value);
        }
        catch (error) {
            return Try.failed(Exception_1.Exception.createFrom(error));
        }
    }
    static safeApplyTry(fn) {
        try {
            return fn();
        }
        catch (error) {
            return Try.failed(Exception_1.Exception.createFrom(error));
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
    valueOrElse(other) {
        if (this.isSuccess())
            return this._value;
        else
            return other;
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
            throw new Exception_1.Exception("Attempting to get an exception for a successful Try");
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
            return Option_1.Option.of(this._value);
        else
            return Option_1.Option.empty();
    }
    toFuture() {
        return Future_1.Future.fromTry(this);
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
                    return Try.failed(new Exception_1.NoSuchElementException({
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
    recoverWith(fn) {
        if (this.isSuccess())
            return this;
        else if (this.isFailure())
            return Try.safeApplyTry(() => fn(this._exception));
    }
    flatMap(fn) {
        if (this.isSuccess())
            return Try.safeApplyTry(() => fn(this._value));
        else if (this.isFailure())
            return TypeUtil_1.unsafeCast(this);
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
exports.Try = Try;
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