"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const es6_promise_1 = require("es6-promise");
const Try_1 = require("./Try");
const Option_1 = require("./Option");
const Exception_1 = require("./Exception");
class Future {
    constructor(_promiseOption, _tryOption) {
        this._promiseOption = _promiseOption;
        this._tryOption = _tryOption;
        this.completeFunctionSubscribers = [];
    }
    init(promiseOption) {
        return (this._setPromiseOption(promiseOption.map(promise => promise
            .then(value => {
            this._onSuccess(value);
            return value;
        })
            .catch(error => {
            this._onFailure(Exception_1.Exception.createFrom(error));
            return error;
        }))));
    }
    static foreverPending() {
        return Future._foreverPending;
    }
    static neverCompleted() {
        return Future.foreverPending();
    }
    static sequence(futures) {
        return Future.fromPromise(es6_promise_1.Promise.all(futures.map(future => future.toPromise())));
    }
    static firstCompletedOf(futures) {
        if (futures.length == 0)
            return Future.foreverPending();
        else
            return (Future.fromPromise(es6_promise_1.Promise.race(futures.map(future => future.toPromise()))));
    }
    static lastCompletedOf(futures) {
        if (futures.length == 0)
            return Future.foreverPending();
        let nbCompleted = 0;
        return (Future.fromPromise(new es6_promise_1.Promise((resolve, reject) => {
            futures.forEach(f => f.onComplete({
                ifSuccess: value => {
                    nbCompleted += 1;
                    if (nbCompleted == futures.length) {
                        resolve(value);
                    }
                },
                ifFailure: ex => {
                    nbCompleted += 1;
                    if (nbCompleted == futures.length) {
                        reject(ex);
                    }
                }
            }));
        })));
    }
    static lazy(f) {
        return Future.lazyWith(() => Future.of(f));
    }
    static lazyWith(f) {
        return new LazyFutureImpl(f);
    }
    static fromPromise(promise) {
        const promiseOption = Option_1.Option.of(promise);
        const future = new Future(promiseOption, Option_1.Option.empty());
        return future.init(promiseOption);
    }
    static startAfterWith(timeout, fn) {
        const f = Future.fromPromise(new es6_promise_1.Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    const value = fn();
                    resolve(value);
                }
                catch (error) {
                    reject(error);
                }
            }, timeout);
        }));
        return f.flatMap(ft => ft);
    }
    static executeAfter(timeout, fn) {
        return Future.fromPromise(new es6_promise_1.Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    const value = fn();
                    resolve(value);
                }
                catch (error) {
                    reject(error);
                }
            }, timeout);
        }));
    }
    static of(fn, executeFnInNewThread = true) {
        if (executeFnInNewThread) {
            return Future.fromPromise(new es6_promise_1.Promise((resolve, reject) => {
                try {
                    const value = fn();
                    resolve(value);
                }
                catch (error) {
                    reject(error);
                }
            }));
        }
        else {
            try {
                const value = fn();
                return Future.successful(value);
            }
            catch (error) {
                return Future.failed(error);
            }
        }
    }
    static ofWith(fn, executeFnInNewThread = true) {
        if (executeFnInNewThread) {
            return Future.fromPromise(new es6_promise_1.Promise((resolve, reject) => {
                try {
                    const future = fn();
                    future.onComplete({
                        ifSuccess: value => resolve(value),
                        ifFailure: exception => reject(exception)
                    });
                }
                catch (error) {
                    reject(error);
                }
            }));
        }
        else {
            try {
                const future = fn();
                return future;
            }
            catch (error) {
                return Future.failed(error);
            }
        }
    }
    static fromTry(t) {
        return t.fold({
            ifSuccess: value => Future.successful(value),
            ifFailure: exception => Future.failed(exception)
        });
    }
    static successful(value) { return new FutureCompletedWithValue(value); }
    static successfulWithVoid() { return Future.successful(true); }
    static failed(exception) { return new FutureCompletedWithException(exception); }
    static notYetStarted() { return new FutureNotYetStarted(); }
    _onSuccess(value) {
        this._tryOption = Option_1.Option.of(Try_1.Try.successful(value));
        this.completeFunctionSubscribers.forEach(o => {
            if (o.ifSuccess != undefined)
                o.ifSuccess(value);
            else if (o.whatEver != undefined)
                o.whatEver();
        });
    }
    _onFailure(exception) {
        this._tryOption = Option_1.Option.of(Try_1.Try.failed(exception));
        this.completeFunctionSubscribers.forEach(o => {
            if (o.ifFailure != undefined)
                o.ifFailure(exception);
            else if (o.whatEver != undefined)
                o.whatEver();
        });
    }
    _setPromiseOption(promiseOption) {
        this._promiseOption = promiseOption;
        return this;
    }
    valueOrNull() {
        if (this.isSuccess())
            return this._tryOption.value.value();
        else
            return null;
    }
    toLazy() { return Future.lazyWith(() => this); }
    exceptionOrNull() {
        if (this.isFailure())
            return this._tryOption.value.exception();
        else
            return null;
    }
    isCompleted() { return this._tryOption.isDefined(); }
    isNotYetStarted() { return this._promiseOption.isEmpty(); }
    isPending() { return (this._promiseOption.isDefined() && !this.isCompleted()); }
    isSuccess() { return this.isCompleted() && this._tryOption.value.isSuccess(); }
    isFailure() { return this.isCompleted() && this._tryOption.value.isFailure(); }
    map(fn) {
        if (this.isFailure()) {
            return this;
        }
        else if (this.isSuccess()) {
            const executeFnInNewThread = false;
            return Future.of(() => fn(this.valueOrNull()), executeFnInNewThread);
        }
        else
            return Future.fromPromise(new es6_promise_1.Promise((resolve, reject) => {
                this.onFailure(error => {
                    reject(error);
                });
                this.onSuccess(value => {
                    try {
                        const mappedValue = fn(value);
                        resolve(mappedValue);
                    }
                    catch (error) {
                        reject(error);
                    }
                });
            }));
    }
    completeBefore(obj) {
        const timeOutPromiseFn = () => new es6_promise_1.Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    if (this.isPending() || this.isNotYetStarted()) {
                        const timeOutFuture = () => {
                            if (obj.orElse === undefined || obj.orElse == null) {
                                return Future.failed(new Exception_1.TimeOutException(`This future took long to be executed, the duration should not have exceeded ${obj.timeOut}ms`));
                            }
                            else {
                                try {
                                    return obj.orElse();
                                }
                                catch (ex) {
                                    return Future.failed(ex);
                                }
                            }
                        };
                        const f = timeOutFuture();
                        resolve(f);
                    }
                }
                catch (error) {
                    reject(error);
                }
            }, obj.timeOut);
        });
        const theFuture = () => new es6_promise_1.Promise((resolve, reject) => {
            this.onComplete(() => resolve(this));
        });
        return (Future
            .fromPromise(es6_promise_1.Promise.race([theFuture(), timeOutPromiseFn()]))
            .flatMap(f => f));
    }
    filter(fn) {
        return this.map(value => {
            if (fn(value))
                return value;
            else
                throw new Exception_1.NoSuchElementException({
                    message: "No such element error: the future was completed with exception '" + this._tryOption.value.exception +
                        "' Hence it did not match the predicate in the filter method you have previously called."
                });
        });
    }
    filterNot(fn) {
        return this.filter(value => !fn(value));
    }
    select(fn) {
        return this.filter(fn);
    }
    flatMap(fn) {
        if (this.isFailure()) {
            return this;
        }
        else if (this.isSuccess()) {
            try {
                return fn(this.valueOrNull());
            }
            catch (error) {
                return Future.failed(error);
            }
        }
        else
            return Future.fromPromise(new es6_promise_1.Promise((resolve, reject) => {
                this.onFailure(error => {
                    reject(error);
                });
                this.onSuccess(value => {
                    try {
                        fn(value).onComplete({
                            ifSuccess: secondValue => {
                                resolve(secondValue);
                            },
                            ifFailure: (error) => {
                                reject(error);
                            }
                        });
                    }
                    catch (error) {
                        reject(error);
                    }
                });
            }));
    }
    toTryOption() { return this._tryOption; }
    toPromise() {
        if (this.isNotYetStarted())
            throw new Exception_1.Exception("Can not transform this Future into a function because this future has not yet started.");
        return this._promiseOption.value;
    }
    toPromiseOption() {
        return this._promiseOption;
    }
    toArray() {
        if (this.isSuccess())
            return [this.valueOrNull()];
        else
            return [];
    }
    forEach(fn) {
        if (this.isSuccess())
            fn(this.valueOrNull());
        else {
            this.completeFunctionSubscribers.push({ ifSuccess: fn });
        }
    }
    onSuccess(fn) {
        if (this.isSuccess())
            fn(this.valueOrNull());
        else {
            this.completeFunctionSubscribers.push({ ifSuccess: fn });
        }
        return this;
    }
    onFailure(fn) {
        if (this.isFailure())
            fn(this.exceptionOrNull());
        else {
            this.completeFunctionSubscribers.push({ ifFailure: fn });
        }
        return this;
    }
    onComplete(fn) {
        if (_.isFunction(fn)) {
            const fnAsFunction = fn;
            if (this.isCompleted())
                fnAsFunction();
            else {
                this.completeFunctionSubscribers.push({ whatEver: fnAsFunction });
            }
        }
        else {
            const fnAsObject = fn;
            if (this.isSuccess())
                fnAsObject.ifSuccess(this._tryOption.value.value());
            else if (this.isFailure())
                fnAsObject.ifFailure(this._tryOption.value.exception());
            else {
                this.completeFunctionSubscribers.push(fnAsObject);
            }
        }
        return this;
    }
    fold(fold) {
        const f2 = fold;
        if (f2.otherwise == undefined) {
            if (this.isNotYetStarted())
                return fold.ifNotYetStarted();
            else if (this.isPending())
                return fold.ifPending();
            else if (this.isFailure())
                return fold.ifFailure(this.exceptionOrNull());
            else if (this.isSuccess())
                return fold.ifSuccess(this.valueOrNull());
        }
        else {
            if (this.isNotYetStarted() && f2.ifNotYetStarted != undefined)
                return fold.ifNotYetStarted();
            else if (this.isPending() && f2.ifPending != undefined)
                return fold.ifPending();
            else if (this.isFailure() && f2.ifFailure != undefined)
                return fold.ifFailure(this.exceptionOrNull());
            else if (this.isSuccess() && f2.ifSuccess != undefined)
                return fold.ifSuccess(this.valueOrNull());
            else
                return f2.otherwise();
        }
    }
    recover(fn) {
        if (this.isSuccess()) {
            return this;
        }
        else if (this.isFailure()) {
            const executeFnInNewThread = false;
            return Future.of(() => fn(this.exceptionOrNull()), executeFnInNewThread);
        }
        else
            return Future.fromPromise(new es6_promise_1.Promise((resolve, reject) => {
                this.onSuccess(value => {
                    resolve(value);
                });
                this.onFailure(error => {
                    try {
                        const recoveredValue = fn(error);
                        resolve(recoveredValue);
                    }
                    catch (error) {
                        reject(error);
                    }
                });
            }));
    }
    delay(duration) {
        return this.flatMap(r => Future.executeAfter(duration, () => r));
    }
    recoverWith(fn) {
        if (this.isSuccess()) {
            return this;
        }
        else if (this.isFailure()) {
            const executeFnInNewThread = false;
            return Future.ofWith(() => fn(this.exceptionOrNull()), executeFnInNewThread);
        }
        else
            return Future.fromPromise(new es6_promise_1.Promise((resolve, reject) => {
                this.onFailure(error => {
                    try {
                        fn(error).onComplete({
                            ifFailure: error => reject(error),
                            ifSuccess: value => resolve(value)
                        });
                    }
                    catch (error) {
                        reject(error);
                    }
                });
                this.onSuccess(value => {
                    resolve(value);
                });
            }));
    }
    transform(transformer) {
        return this.map(transformer.ifSuccess).recover(transformer.ifFailure);
    }
    transformWith(transformer) {
        return this.flatMap(transformer.ifSuccess).recoverWith(transformer.ifFailure);
    }
    start() { return this; }
    isLazy() { return false; }
    toString() {
        return (this.fold({
            ifPending: () => "Future(Pending)",
            ifSuccess: value => `Future(Success(${value}))`,
            ifFailure: exception => `Future(Failure(${exception}))`,
            ifNotYetStarted: () => "Future(NotYetStarted)",
        }));
    }
}
Future._foreverPending = Future.fromPromise(new es6_promise_1.Promise((resolve, reject) => { }));
exports.Future = Future;
class FutureCompletedWithValue extends Future {
    constructor(value) {
        super(Option_1.Option.of(es6_promise_1.Promise.resolve(value)), Option_1.Option.of(Try_1.Try.successful(value)));
    }
    toString() { return super.toString(); }
}
class FutureCompletedWithException extends Future {
    constructor(exception) {
        super(Option_1.Option.of(es6_promise_1.Promise.reject(exception)), Option_1.Option.of(Try_1.Try.failed(exception)));
    }
    toString() { return super.toString(); }
}
class FutureNotYetStarted extends Future {
    constructor() {
        super(Option_1.Option.empty(), Option_1.Option.empty());
    }
    toString() { return super.toString(); }
}
class LazyFuture extends Future {
    constructor(f) {
        super(Option_1.Option.empty(), Option_1.Option.empty());
        this.f = f;
        this.evalFutureOption = Option_1.Option.empty();
    }
    evalF() {
        if (this.evalFutureOption.isDefined())
            return this.evalFutureOption.value;
        else {
            const evalFuture = this.f().start();
            this.evalFutureOption = Option_1.Option.of(evalFuture);
            return this.init(Option_1.Option.of(evalFuture.toPromise()));
        }
    }
    evalFafter(duration) {
        const future = Future.executeAfter(duration, () => {
            if (this.evalFutureOption.isDefined())
                return this.evalFutureOption.value;
            else {
                const evalFuture = this.f().start();
                this.evalFutureOption = Option_1.Option.of(evalFuture);
                return this.init(Option_1.Option.of(evalFuture.toPromise()));
            }
        });
        return future.flatMap(f => f);
    }
    isLazy() { return true; }
    toString() {
        return (this.fold({
            ifPending: () => "LazyFuture(Pending)",
            ifSuccess: value => `LazyFuture(Success(${value}))`,
            ifFailure: exception => `LazyFuture(Failure(${exception}))`,
            ifNotYetStarted: () => "LazyFuture(NotYetStarted)",
        }));
    }
}
exports.LazyFuture = LazyFuture;
class LazyFutureImpl extends LazyFuture {
    constructor(f) {
        super(f);
    }
    map(fn) {
        const f = () => this.evalF().map(fn);
        return Future.lazyWith(f);
    }
    filter(fn) {
        const f = () => this.evalF().filter(fn);
        return Future.lazyWith(f);
    }
    filterNot(fn) {
        const f = () => this.evalF().filterNot(fn);
        return Future.lazyWith(f);
    }
    select(fn) { return this.filter(fn); }
    reject(fn) { return this.filterNot(fn); }
    flatMap(fn) {
        const f = () => this.evalF().flatMap(fn);
        return Future.lazyWith(f);
    }
    toLazy() { return this; }
    onSuccess(fn) {
        const f = () => this.evalF().onSuccess(fn);
        return Future.lazyWith(f);
    }
    onFailure(fn) {
        const f = () => this.evalF().onFailure(fn);
        return Future.lazyWith(f);
    }
    onComplete(fn) {
        const f = () => this.evalF().onComplete(fn);
        return Future.lazyWith(f);
    }
    recover(fn) {
        const f = () => this.evalF().recover(fn);
        return Future.lazyWith(f);
    }
    recoverWith(fn) {
        const f = () => this.evalF().recoverWith(fn);
        return Future.lazyWith(f);
    }
    transform(transformer) {
        const f = () => this.evalF().transform(transformer);
        return Future.lazyWith(f);
    }
    transformWith(transformer) {
        const f = () => this.evalF().transformWith(transformer);
        return Future.lazyWith(f);
    }
    completeBefore(obj) {
        const f = () => this.evalF().completeBefore(obj);
        return Future.lazyWith(f);
    }
    delay(duration) {
        return this.flatMap(r => Future.executeAfter(duration, () => r));
    }
    forEach(fn) {
        this.evalF().forEach(fn);
    }
    toString() { return super.toString(); }
    start() { return this.evalF(); }
    startAfter(duration) { return this.evalFafter(duration); }
}
//# sourceMappingURL=Future.js.map