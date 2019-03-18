import * as _ from "lodash";
import {Promise} from "es6-promise";
import {Try} from "./Try";
import {Option} from "./Option";
import {Exception, NoSuchElementException, TimeOutException} from "./Exception";


export type VoidFunction = () => void;
export type OnComplete<T> = {
    ifSuccess ?: (result:T) => void,
    ifFailure ?: (exception:Exception) => void,
    whatEver  ?: () => void,
};


export class Future<T> {

    private completeFunctionSubscribers  : Array<OnComplete<T>> = [];

    protected constructor(protected _promiseOption:Option<Promise<T>>,
                          protected _tryOption:Option<Try<T>>){}



    protected init(promiseOption:Option<Promise<T>>): Future<T>{
        return (
            this._setPromiseOption(
                promiseOption.map(promise =>
                    promise
                        .then(value => {
                            this._onSuccess(value);
                            return value;
                        })
                        .catch(error => {
                            this._onFailure(Exception.createFrom(error));
                            return error;
                        })
                ))
        );
    }

    private static _foreverPending = Future.fromPromise<any>(new Promise((resolve, reject) => {}));


    static foreverPending<T>() : Future<T> {
        return Future._foreverPending as Future<T>;
    }

    static neverCompleted<T>() : Future<T> {
        return Future.foreverPending<T>();
    }

    static all<T>(futures: Array<Future<T>>): Future<Array<T>>{
        return Future.fromPromise(Promise.all(futures.map(future => future.toPromise())))
    }

    static firstCompletedOf<T>(futures: Array<Future<T>>): Future<T>{
        if(futures.length == 0) return Future.foreverPending<T>();
        else return (Future.fromPromise(Promise.race(futures.map(future => future.toPromise()))) );
    }

    // static firstSuccessOf<T>(futures: Array<Future<T>>): Future<T>
    // static firstFailureOf<T>(futures: Array<Future<T>>): Future<T>

    // static nthCompletedOf<T>(nth:number, futures: Array<Future<T>>): Future<Array<T>>
    // static   nthSuccessOf<T>(nth:number, futures: Array<Future<T>>): Future<Array<T>>
    // static   nthFailureOf<T>(nth:number, futures: Array<Future<T>>): Future<Array<T>>

    // static lastSuccessOf<T>(futures: Array<Future<T>>): Future<T>
    // static lastFailureOf<T>(futures: Array<Future<T>>): Future<T>


    static lastCompletedOf<T>(futures: Array<Future<T>>): Future<T>{
        if(futures.length == 0) return Future.foreverPending<T>();

        let nbCompleted = 0;
        return (
            Future.fromPromise(new Promise<T>((resolve, reject) => {
                futures.forEach(f =>  f.onComplete({
                    ifSuccess : value => {
                        nbCompleted += 1;
                        if (nbCompleted == futures.length) {
                            resolve(value);
                        }
                    },
                    ifFailure : ex => {
                        nbCompleted += 1;
                        if (nbCompleted == futures.length) {
                            reject(ex)
                        }
                    }
                }))
            }))
        );
    }

    static lazyFrom<T>(f: () => T) : LazyFuture<T> {
        return Future.lazyFromFuture(() => Future.from(f));
    }

    static lazyFromFuture<T>(f: () => Future<T>) : LazyFuture<T> {
        return  new LazyFutureImpl(f);
    }

    static lazyFromPromise<T>(promise:Promise<T>) : LazyFuture<T> {
        return  Future.lazyFromFuture(() => Future.fromPromise(promise));
    }

    static lazyFromPromiseFn<T>(fn: () => Promise<T>) : LazyFuture<T> {
        return  Future.lazyFromFuture(() => Future.fromPromiseFn(fn));
    }

    static fromPromiseFn<T>(fn: () => Promise<T>) : Future<T> {
        try {
            const promise = fn();
            return Future.fromPromise(promise);
        }
        catch (error) {
            return Future.fromPromise<T>(Promise.reject(error));
        }
    }

    static fromPromise<T>(promise: Promise<T>) : Future<T> {
        const promiseOption = Option.of(promise);
        const future = new Future(promiseOption, Option.empty<Try<T>>());
        return future.init(promiseOption);
    }

    static startAfter<T>(timeout:number, fn : () => Future<T>) : Future<T> {
        const f : Future<Future<T>> = Future.fromPromise<Future<T>>(
            new Promise<Future<T>>((resolve, reject) => {
                setTimeout(() => {
                    try {
                        const value = fn();
                        resolve(value);
                    }
                    catch (error){
                        reject(error)
                    }
                }, timeout);
            })
        );
        return f.flatMap(ft => ft)
    }
    static executeAfter<T>(timeout:number, fn : () => T) : Future<T> {
        return Future.fromPromise<T>(
            new Promise((resolve, reject) => {
                setTimeout(() => {
                    try {
                        const value = fn();
                        resolve(value);
                    } catch (error){
                        reject(error)
                    }
                }, timeout);
            })
        );
    }

    static from<T>(fn: () => T, executeFnInNewThread:boolean = true) : Future<T> {
        if(executeFnInNewThread){
            return Future.fromPromise<T>(
                new Promise((resolve, reject) => {
                    try {
                        const value = fn();
                        resolve(value);
                    } catch (error){
                        reject(error)
                    }
                })
            );
        }
        else {
            try {
                const value = fn();
                return Future.successful<T>(value);
            } catch (error){
                return Future.failed<T>(error)
            }
        }
    }

    static fromFuture<T>(fn: () => Future<T>, executeFnInNewThread:boolean = true) : Future<T> {
        if(executeFnInNewThread){
            return Future.fromPromise<T>(
                new Promise((resolve, reject) => {
                    try {
                        const future = fn();
                        future.onComplete({
                            ifSuccess : value => resolve(value),
                            ifFailure : exception => reject(exception)
                        });
                    } catch (error){
                        reject(error)
                    }
                })
            );
        }
        else {
            try {
                const future = fn();
                return future;
            } catch (error){
                return Future.failed<T>(error)
            }
        }
    }

    static fromTry<T>(t:Try<T>) : Future<T> {
        return t.fold({
            ifSuccess : value => Future.successful<T>(value),
            ifFailure : exception => Future.failed<T>(exception)
        });
    }

    static successful<T>(value:T) : Future<T> { return new FutureCompletedWithValue(value); }

    static successfulWithVoid() : Future<void> { return Future.successful(true) as any as Future<void>; }

    static failed<T>(exception:Exception) :  Future<T>  { return new FutureCompletedWithException(exception); }

    static notYetStarted<T>() : Future<T> { return new FutureNotYetStarted() as Future<T>; }

    private _onSuccess(value:T){
        this._tryOption = Option.of(Try.successful<T>(value));
        this.completeFunctionSubscribers.forEach(o => {
            if(o.ifSuccess != undefined) o.ifSuccess(value);
            else if(o.whatEver != undefined) o.whatEver();
        });
    }

    private _onFailure(exception:Exception){
        this._tryOption = Option.of(Try.failed<T>(exception));
        this.completeFunctionSubscribers.forEach(o => {
            if(o.ifFailure != undefined)o.ifFailure(exception);
            else if(o.whatEver != undefined) o.whatEver();
        });
    }

    private _setPromiseOption(promiseOption: Option<Promise<T>>) : Future<T> {
        this._promiseOption = promiseOption;
        return this;
    }

    valueOrNull() : T {
        if(this.isSuccess()) return this._tryOption.value.value();
        else return null;
    }

    toLazy() : LazyFuture<T> { return Future.lazyFromFuture(() => this)}

    exceptionOrNull() : Exception {
        if(this.isFailure()) return this._tryOption.value.exception();
        else return null;
    }

    isCompleted() { return this._tryOption.isDefined();  }

    isNotYetStarted() { return this._promiseOption.isEmpty();  }

    isPending() { return (this._promiseOption.isDefined() && !this.isCompleted()) }

    isSuccess() { return this.isCompleted() && this._tryOption.value.isSuccess();  }

    isFailure() { return this.isCompleted() && this._tryOption.value.isFailure();  }

    map<U>(fn : (result:T) => U) : Future<U>{
        if(this.isFailure()){
            return this as any as Future<U>;
        }
        else if(this.isSuccess()){
            const executeFnInNewThread = false;
            return Future.from(() => fn(this.valueOrNull()), executeFnInNewThread)
        }
        else return Future.fromPromise<U>(
                new Promise((resolve, reject) => {
                    this.onFailure(error => {
                        reject(error);
                    });
                    this.onSuccess(value => {
                        try {
                            const mappedValue = fn(value);
                            resolve(mappedValue);
                        } catch (error) {
                            reject(error)
                        }
                    })
                })
            );
    }

    completeBefore(obj : { timeOut : number, orElse ?: () => Future<T> }) : Future<T> {
        const timeOutPromiseFn : () => Promise<Future<T>> =
            () => new Promise((resolve, reject) => {
                setTimeout(() => {
                    try {
                        // After the duration , If this promise is completed, there is no need to execute
                        // the orElse Part from the argument. We execute this if and only
                        // if this future is pending.
                        if(this.isPending() || this.isNotYetStarted()){
                            const timeOutFuture =
                                () => {
                                    if(obj.orElse === undefined || obj.orElse == null){
                                        return Future.failed(new TimeOutException(`This future took long to be executed, the duration should not have exceeded ${obj.timeOut}ms`));
                                    } else {
                                        try { return obj.orElse()} catch (ex) { return Future.failed(ex) }
                                    }
                                };
                            const f = timeOutFuture();
                            // @ts-ignore
                            resolve(f)
                        }
                    } catch (error) {
                        reject(error)
                    }
                }, obj.timeOut);
            });
        const theFuture : () => Promise<Future<T>> =
            () => new Promise((resolve, reject) => {
                this.onComplete(() => resolve(this))
            });

        return (
            Future
                .fromPromise<Future<T>>(Promise.race([theFuture(), timeOutPromiseFn()]))
                .flatMap(f => f)
        );
    }

    filter(fn : (res:T) => boolean) : Future<T> {
        return this.map<T>(value => {
            if(fn(value)) return value;
            else throw new NoSuchElementException({
                message : "No such element error: the future was completed with exception '"+ this._tryOption.value.exception +
                    "' Hence it did not match the predicate in the filter method you have previously called."
            })
        });
    }

    filterNot(fn : (res:T) => boolean) : Future<T> {
        return this.filter(value => !fn(value));
    }

    select(fn : (res:T) => boolean) : Future<T> {
        return this.filter(fn);
    }

    flatMap<U>(fn : (result:T) => Future<U>) : Future<U> {
        if(this.isFailure()){
            return this as any as Future<U>;
        }
        else if(this.isSuccess()){
            try {
                return fn(this.valueOrNull());
            } catch (error){
                return Future.failed<U>(error)
            }
        }
        else return Future.fromPromise<U>(
                new Promise((resolve, reject) => {
                    this.onFailure(error => {
                        reject(error);
                    });

                    this.onSuccess(value => {
                        try {
                            fn(value).onComplete({
                                ifSuccess : secondValue => {
                                    resolve(secondValue);
                                },
                                ifFailure : (error) => {
                                    reject(error);
                                }
                            });
                        } catch (error){
                            reject(error)
                        }
                    })
                })
            )
    }

    toTryOption() : Option<Try<T>> { return this._tryOption; }

    toPromise() : Promise<T> {
        if(this.isNotYetStarted()) throw new Exception("Can not transform this Future into a function because this future has not yet started.");
        return this._promiseOption.value;
    }

    toPromiseOption() : Option<Promise<T>> {
        return this._promiseOption;
    }

    toArray() : Array<T> {
        if(this.isSuccess()) return [this.valueOrNull()];
        else return [];
    }

    forEach(fn : (res:T) => void) : void {
        if(this.isSuccess()) fn(this.valueOrNull());
        else {
            this.completeFunctionSubscribers.push({ ifSuccess : fn});
        }
    }

    onSuccess(fn : (res:T) => void) : void {
        if(this.isSuccess()) fn(this.valueOrNull());
        else {
            this.completeFunctionSubscribers.push({ ifSuccess : fn});
        }
    }

    onFailure(fn : (exception:Exception) => void) : void {
        if(this.isFailure()) fn(this.exceptionOrNull());
        else {
            this.completeFunctionSubscribers.push({ ifFailure : fn});
        }
    }

    /**
     *
     * @Note : In typescript 2.1, it is impossible to type correctly the following signature :
     *  onComplete(fn: (Try<T>) => void) : void {} because generic type is not allowed
     *  in function parameter type.
     * @param fn : Function to be applied once the future will be completed or immediately if
     *          the future has already been complete at the call time.
     */
    onComplete(fn : VoidFunction | { ifSuccess : (result:T) => void, ifFailure : (exception:Exception) => void }) : void {
        if(_.isFunction(fn)) {
            const fnAsFunction = fn as VoidFunction;
            if(this.isCompleted()) fnAsFunction();
            else {
                this.completeFunctionSubscribers.push({ whatEver : fnAsFunction });
            }
        }
        else {
            const fnAsObject = fn as OnComplete<T>;
            if(this.isSuccess()) fnAsObject.ifSuccess(this._tryOption.value.value());
            else if(this.isFailure()) fnAsObject.ifFailure(this._tryOption.value.exception());
            else {
                this.completeFunctionSubscribers.push(fnAsObject);
            }
        }
    }

    fold<U>(fold : { ifPending : () => U,  ifNotYetStarted : () => U, ifSuccess : (result:T) => U, ifFailure : (exception:Exception) => U} |
        { otherwise : () => U, ifPending ?: () => U,  ifNotYetStarted ?: () => U, ifSuccess ?: (result:T) => U, ifFailure ?: (exception:Exception) => U} ) : U {

        // const f1 = fold as { ifPending : () => U,  ifNotYetStarted : () => U, ifSuccess : (result:T) => U, ifFailure : (exception:Exception) => U};
        const f2 = fold as { otherwise : () => U, ifPending ?: () => U,  ifNotYetStarted ?: () => U, ifSuccess ?: (result:T) => U, ifFailure ?: (exception:Exception) => U};
        if(f2.otherwise == undefined){
            if(this.isNotYetStarted()) return fold.ifNotYetStarted();
            else  if(this.isPending()) return fold.ifPending();
            else  if(this.isFailure()) return fold.ifFailure(this.exceptionOrNull());
            else  if(this.isSuccess()) return fold.ifSuccess(this.valueOrNull());
        }
        else {
            if(this.isNotYetStarted() && f2.ifNotYetStarted != undefined) return fold.ifNotYetStarted();
            else  if(this.isPending() && f2.ifPending != undefined) return fold.ifPending();
            else  if(this.isFailure() && f2.ifFailure != undefined) return fold.ifFailure(this.exceptionOrNull());
            else  if(this.isSuccess() && f2.ifSuccess != undefined) return fold.ifSuccess(this.valueOrNull());
            else return f2.otherwise();
        }
    }

    recover(fn: (exception:Exception) => T) : Future<T> {
        if(this.isSuccess()){
            return this;
        }
        else if(this.isFailure()){
            const executeFnInNewThread = false;
            return Future.from(() => fn(this.exceptionOrNull()), executeFnInNewThread);
        }
        else return Future.fromPromise<T>(
                new Promise((resolve, reject) => {
                    this.onSuccess(value => {
                        resolve(value);
                    });
                    this.onFailure(error => {
                        try {
                            const recoveredValue = fn(error);
                            resolve(recoveredValue);
                        } catch (error) {
                            reject(error)
                        }
                    });
                })
            );
    }

    delay(duration:number) : Future<T> {
        return this.flatMap(r => Future.executeAfter(duration, () => r))
    }

    flatRecover(fn: (exception:Exception) => Future<T>) : Future<T> {
        if(this.isSuccess()){
            return this;
        }
        else if(this.isFailure()){
            const executeFnInNewThread = false;
            return Future.fromFuture(() => fn(this.exceptionOrNull()), executeFnInNewThread);
        }
        else return Future.fromPromise<T>(
                new Promise<T>((resolve, reject) => {
                    this.onFailure(error => {
                        try {
                            fn(error).onComplete({
                                ifFailure : error => reject(error),
                                ifSuccess : value => resolve(value)
                            });
                        } catch (error){
                            reject(error)
                        }
                    });

                    this.onSuccess(value => {
                        resolve(value as any); // TODO How to constraint U to be a super type from T to give a sens to this ?
                    })
                })
            )
    }

    transform<U>(transformer : () => U): Future<U> {
        return this.map(transformer).recover(transformer);
    }

    flatTransform<U>(transformer : () => Future<U>): Future<U> {
        return this.flatMap(transformer).flatRecover(transformer);
    }

    start() : Future<T> { return this; }

    isLazy() : boolean { return false; }

    toString(): string {
        return (
            this.fold<string>({
                ifPending : () => "Future(Pending)",
                ifSuccess : value => `Future(Success(${value}))`,
                ifFailure : exception => `Future(Failure(${exception}))`,
                ifNotYetStarted : () => "Future(NotYetStarted)",
            })
        );
    }
}



class FutureCompletedWithValue<T> extends Future<T> {

    constructor(value:T){
        super(Option.of(Promise.resolve(value)), Option.of<Try<T>>(Try.successful(value)))
    }

    toString():string { return super.toString(); }
}

class FutureCompletedWithException extends Future<any> {

    constructor(exception:Exception){
        super(Option.of(Promise.reject(exception)), Option.of<Try<any>>(Try.failed(exception)))
    }

    toString():string { return super.toString(); }
}

class FutureNotYetStarted extends Future<any> {

    constructor(){
        super(Option.empty<any>(), Option.empty<any>())
    }

    toString():string { return super.toString(); }
}

export abstract class LazyFuture<T> extends Future<T> {

    private evalFutureOption: Option<Future<T>>;

    protected constructor(protected readonly f : () => Future<T>){
        super(Option.empty<any>(), Option.empty<any>());
        this.evalFutureOption = Option.empty<Future<T>>();
    }

    protected evalF() : Future<T> {
        if(this.evalFutureOption.isDefined()) return this.evalFutureOption.value;
        else {
            const evalFuture = this.f().start();
            this.evalFutureOption  = Option.of(evalFuture);
            return this.init(Option.of(evalFuture.toPromise()));
        }
    }

    protected  evalFafter(duration:number) : Future<T> {
        const future : Future<Future<T>> =
            Future.executeAfter<Future<T>>(duration, () => {
                if(this.evalFutureOption.isDefined()) return this.evalFutureOption.value;
                else {
                    const evalFuture = this.f().start();
                    this.evalFutureOption  = Option.of(evalFuture);
                    return this.init(Option.of(evalFuture.toPromise()));
                }
            });
        return future.flatMap(f => f)
    }


    /*
    static from<T>(f : () => T) : LazyFuture<T> {
        return LazyFuture.ofFuture(() => Future.from(f));
    }

    static ofFuture<T>(f : () => Future<T>) : LazyFuture<T> {
        return new LazyFutureImpl(f);
    }
    */

    isLazy() : boolean { return true; }

    toString(): string {
        return (
            this.fold<string>({
                ifPending : () => "LazyFuture(Pending)",
                ifSuccess : value => `LazyFuture(Success(${value}))`,
                ifFailure : exception => `LazyFuture(Failure(${exception}))`,
                ifNotYetStarted : () => "LazyFuture(NotYetStarted)",
            })
        );
    }
}
class LazyFutureImpl<T> extends LazyFuture<T> {


    constructor(f : () => Future<T>){
        super(f);
    }


    map<U>(fn : (result:T) => U) : LazyFuture<U> {
        const f : () => Future<U> = () => this.evalF().map(fn);
        return Future.lazyFromFuture(f)
    }

    filter(fn : (res:T) => boolean) : LazyFuture<T> {
        const f : () => Future<T> = () => this.evalF().filter(fn);
        return Future.lazyFromFuture(f)
    }

    filterNot(fn : (res:T) => boolean) :LazyFuture<T> {
        const f : () => Future<T> = () => this.evalF().filterNot(fn);
        return Future.lazyFromFuture(f)
    }

    select(fn : (res:T) => boolean) : LazyFuture<T> { return this.filter(fn); }

    reject(fn : (res:T) => boolean) : LazyFuture<T> { return this.filterNot(fn); }

    flatMap<U>(fn : (result:T) => Future<U>) : LazyFuture<U> {
        const f : () => Future<U> = () => this.evalF().flatMap(fn);
        return Future.lazyFromFuture(f)
    }

    toLazy() : LazyFuture<T> { return this; }


    onSuccess(fn : (res:T) => void) : void {
        this.evalF().onSuccess(fn);
    }

    onFailure(fn : (exception:Exception) => void) : void {
        this.evalF().onFailure(fn);
    }

    onComplete(fn : VoidFunction | { ifSuccess : (result:T) => void, ifFailure : (exception:Exception) => void }) : void {
        this.evalF().onComplete(fn);
    }

    recover(fn: (exception:Exception) => T) : LazyFuture<T> {
        const f : () => Future<T> = () => this.evalF().recover(fn);
        return Future.lazyFromFuture(f)
    }

    flatRecover(fn: (exception:Exception) => Future<T>) : LazyFuture<T>{
        const f : () => Future<T> = () => this.evalF().flatRecover(fn);
        return Future.lazyFromFuture(f)
    }

    transform<U>(transformer : () => U): LazyFuture<U>{
        const f : () => Future<U> = () => this.evalF().transform(transformer);
        return Future.lazyFromFuture(f)
    }

    flatTransform<U>(transformer : () => Future<U>): LazyFuture<U>{
        const f : () => Future<U> = () => this.evalF().flatTransform(transformer);
        return Future.lazyFromFuture(f)
    }

    completeBefore(obj : { timeOut : number, orElse ?: () => Future<T> }) : LazyFuture<T> {
        const f : () => Future<T> = () => this.evalF().completeBefore(obj);
        return Future.lazyFromFuture(f)
    }

    delay(duration:number) : LazyFuture<T> {
        return this.flatMap(r => Future.executeAfter(duration, () => r))
    }

    // EAGER
    forEach(fn : (res:T) => void) : void {
        this.evalF().forEach(fn)
    }

    toString():string { return super.toString(); }

    start() : Future<T> { return this.evalF(); }

    reinitialize() : LazyFuture<T> { return Future.lazyFromFuture(this.f); }

    startAfter(duration:number) : Future<T> { return this.evalFafter(duration); }
}