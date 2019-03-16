import {Option} from "./Option";
import {Future} from "./Future";
import {unsafeCast} from "./TypeUtil";
import {Exception, NoSuchElementException} from "./Exception";

export abstract class Try<T> {
    protected _value: T;
    protected _exception: Exception;

    protected static safeApply<Result>(fn : () => Result) : Try<Result> {
        try{
            const value = fn();
            return Try.successful(value);
        } catch (error){
            return Try.failed<Result>(Exception.createFrom(error));
        }
    }

    protected static safeApplyTry<T>(fn : () => Try<T>) : Try<T> {
        try{
            return fn();
        } catch (error){
            return Try.failed<T>(Exception.createFrom(error));
        }
    }

    static of<T>(fn: () => T): Try<T> {
        return Try.safeApply<T>(() => fn());
    }

    static failed<T>(exception:Exception): Try<T> {
        return new Failure(exception) as Try<T>
    }

    static successful<T>(value:T): Try<T> {
        return new Success(value);
    }

    isSuccess(): boolean {
        return (this._value != undefined);
    }

    isFailure(): boolean {
        return !this.isSuccess();
    }

    valueOrElse(other: T): T {
        if (this.isSuccess()) return this._value;
        else return other;
    }

    valueOrNull(): T {
        if (this.isSuccess()) return this._value;
        else return null;
    }

    value(): T {
        if (this.isSuccess()) return this._value;
        else throw this._exception;
    }

    exception(): Exception {
        if (this.isFailure()) return this._exception;
        else throw new Exception("Attempting to get an exception for a successful Try");
    }


    exceptionOrElse(other: Exception): Exception {
        if (this.isFailure()) return this._exception;
        else return other;
    }

    exceptionOrNull(): Exception {
        if (this.isFailure()) return this._exception;
        else return null;
    }

    toOption(): Option<T> {
        if (this.isSuccess()) return  Option.of(this._value);
        else return Option.empty<T>();
    }

    toFuture(): Future<T> {
        return Future.fromTry(this);
    }

    forEach(fn: (result:T) => void): void {
        if (this.isSuccess()) fn(this._value);
    }

    map<U>(fn:(result:T) => U): Try<U>{
        if (this.isSuccess()) return Try.of<U>(() => fn(this._value));
        else {
            return this as any as Try<U>;
        }
    }

    select(fn:(result:T) => boolean): Try<T> { return this.filter(fn) }

    filter(fn:(result:T) => boolean): Try<T> {
        if (this.isFailure()) return this;
        else {
            Try.safeApplyTry(() => {
                if(fn(this._value)) return this;
                else {
                    return Try.failed<T>(
                        new NoSuchElementException({
                            message : "No such element exception: the value '"+ this._value +
                            "' did not match the predicate in on the filter method you have previously called"
                        })
                    );
                }
            });
        }
    }

    recover(fn: (exception:Exception) => T) : Try<T> {
        if(this.isSuccess()) return this;
        else if(this.isFailure()) return Try.of(() => fn(this._exception));
    }

    recoverWith(fn: (exception:Exception) => Try<T>) : Try<T> {
        if(this.isSuccess()) return this;
        else if(this.isFailure()) return Try.safeApplyTry<T>(() => fn(this._exception));
    }

    flatMap<U>(fn:(result:T) => Try<U>): Try<U>{
        if(this.isSuccess()) return Try.safeApplyTry<U>(() => fn(this._value));
        else if(this.isFailure()) return unsafeCast<Try<T>, Try<U>>(this);
    }

    transform<U>(trans: {ifSuccess : (result:T) => Try<U>, ifFailure : (exception:Exception) => Try<U>}) : Try<U>{
        if (this.isSuccess()) return Try.safeApplyTry<U>(() => trans.ifSuccess(this._value));
        else return Try.safeApplyTry<U>(() => trans.ifFailure(this._exception));
    }

    fold<U>(fold: {ifSuccess: (result:T) => U, ifFailure: (exception:Exception) => U }): U {
        if (this.isSuccess()) return fold.ifSuccess(this._value);
        else return fold.ifFailure(this._exception);
    }
}

class Success<Result> extends Try<Result> {

    constructor(value:Result){
        super();
        this._value = value;
    }
}

class Failure extends Try<any> {

    constructor(exception:Exception){
        super();
        this._exception = exception;
    }
}
