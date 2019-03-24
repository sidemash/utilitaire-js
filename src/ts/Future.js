"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require("lodash");
var es6_promise_1 = require("es6-promise");
var Try_1 = require("./Try");
var Option_1 = require("./Option");
var Exception_1 = require("./Exception");
var Future = (function () {
    function Future(_promiseOption, _tryOption) {
        this._promiseOption = _promiseOption;
        this._tryOption = _tryOption;
        this.completeFunctionSubscribers = [];
    }
    Future.prototype.init = function (promiseOption) {
        var _this = this;
        return (this._setPromiseOption(promiseOption.map(function (promise) {
            return promise
                .then(function (value) {
                _this._onSuccess(value);
                return value;
            })
                .catch(function (error) {
                _this._onFailure(Exception_1.Exception.createFrom(error));
                return error;
            });
        })));
    };
    Future.foreverPending = function () {
        return Future._foreverPending;
    };
    Future.neverCompleted = function () {
        return Future.foreverPending();
    };
    Future.all = function (futures) {
        return Future.fromPromise(es6_promise_1.Promise.all(futures.map(function (future) { return future.toPromise(); })));
    };
    Future.firstCompletedOf = function (futures) {
        if (futures.length == 0)
            return Future.foreverPending();
        else
            return (Future.fromPromise(es6_promise_1.Promise.race(futures.map(function (future) { return future.toPromise(); }))));
    };
    Future.lastCompletedOf = function (futures) {
        if (futures.length == 0)
            return Future.foreverPending();
        var nbCompleted = 0;
        return (Future.fromPromise(new es6_promise_1.Promise(function (resolve, reject) {
            futures.forEach(function (f) { return f.onComplete({
                ifSuccess: function (value) {
                    nbCompleted += 1;
                    if (nbCompleted == futures.length) {
                        resolve(value);
                    }
                },
                ifFailure: function (ex) {
                    nbCompleted += 1;
                    if (nbCompleted == futures.length) {
                        reject(ex);
                    }
                }
            }); });
        })));
    };
    Future.lazyFrom = function (f) {
        return Future.lazyFromFuture(function () { return Future.from(f); });
    };
    Future.lazyFromFuture = function (f) {
        return new LazyFutureImpl(f);
    };
    Future.lazyFromPromise = function (promise) {
        return Future.lazyFromFuture(function () { return Future.fromPromise(promise); });
    };
    Future.lazyFromPromiseFn = function (fn) {
        return Future.lazyFromFuture(function () { return Future.fromPromiseFn(fn); });
    };
    Future.fromPromiseFn = function (fn) {
        try {
            var promise = fn();
            return Future.fromPromise(promise);
        }
        catch (error) {
            return Future.fromPromise(es6_promise_1.Promise.reject(error));
        }
    };
    Future.fromPromise = function (promise) {
        var promiseOption = Option_1.Option.of(promise);
        var future = new Future(promiseOption, Option_1.Option.empty());
        return future.init(promiseOption);
    };
    Future.startAfter = function (timeout, fn) {
        var f = Future.fromPromise(new es6_promise_1.Promise(function (resolve, reject) {
            setTimeout(function () {
                try {
                    var value = fn();
                    resolve(value);
                }
                catch (error) {
                    reject(error);
                }
            }, timeout);
        }));
        return f.flatMap(function (ft) { return ft; });
    };
    Future.executeAfter = function (timeout, fn) {
        return Future.fromPromise(new es6_promise_1.Promise(function (resolve, reject) {
            setTimeout(function () {
                try {
                    var value = fn();
                    resolve(value);
                }
                catch (error) {
                    reject(error);
                }
            }, timeout);
        }));
    };
    Future.from = function (fn, executeFnInNewThread) {
        if (executeFnInNewThread === void 0) { executeFnInNewThread = true; }
        if (executeFnInNewThread) {
            return Future.fromPromise(new es6_promise_1.Promise(function (resolve, reject) {
                try {
                    var value = fn();
                    resolve(value);
                }
                catch (error) {
                    reject(error);
                }
            }));
        }
        else {
            try {
                var value = fn();
                return Future.successful(value);
            }
            catch (error) {
                return Future.failed(error);
            }
        }
    };
    Future.fromFuture = function (fn, executeFnInNewThread) {
        if (executeFnInNewThread === void 0) { executeFnInNewThread = true; }
        if (executeFnInNewThread) {
            return Future.fromPromise(new es6_promise_1.Promise(function (resolve, reject) {
                try {
                    var future = fn();
                    future.onComplete({
                        ifSuccess: function (value) { return resolve(value); },
                        ifFailure: function (exception) { return reject(exception); }
                    });
                }
                catch (error) {
                    reject(error);
                }
            }));
        }
        else {
            try {
                var future = fn();
                return future;
            }
            catch (error) {
                return Future.failed(error);
            }
        }
    };
    Future.fromTry = function (t) {
        return t.fold({
            ifSuccess: function (value) { return Future.successful(value); },
            ifFailure: function (exception) { return Future.failed(exception); }
        });
    };
    Future.successful = function (value) { return new FutureCompletedWithValue(value); };
    Future.successfulWithVoid = function () { return Future.successful(true); };
    Future.failed = function (exception) { return new FutureCompletedWithException(exception); };
    Future.notYetStarted = function () { return new FutureNotYetStarted(); };
    Future.prototype._onSuccess = function (value) {
        this._tryOption = Option_1.Option.of(Try_1.Try.successful(value));
        this.completeFunctionSubscribers.forEach(function (o) {
            if (o.ifSuccess != undefined)
                o.ifSuccess(value);
            else if (o.whatEver != undefined)
                o.whatEver();
        });
    };
    Future.prototype._onFailure = function (exception) {
        this._tryOption = Option_1.Option.of(Try_1.Try.failed(exception));
        this.completeFunctionSubscribers.forEach(function (o) {
            if (o.ifFailure != undefined)
                o.ifFailure(exception);
            else if (o.whatEver != undefined)
                o.whatEver();
        });
    };
    Future.prototype._setPromiseOption = function (promiseOption) {
        this._promiseOption = promiseOption;
        return this;
    };
    Future.prototype.valueOrNull = function () {
        if (this.isSuccess())
            return this._tryOption.value.value();
        else
            return null;
    };
    Future.prototype.toLazy = function () {
        var _this = this;
        return Future.lazyFromFuture(function () { return _this; });
    };
    Future.prototype.exceptionOrNull = function () {
        if (this.isFailure())
            return this._tryOption.value.exception();
        else
            return null;
    };
    Future.prototype.isCompleted = function () { return this._tryOption.isDefined(); };
    Future.prototype.isNotYetStarted = function () { return this._promiseOption.isEmpty(); };
    Future.prototype.isPending = function () { return (this._promiseOption.isDefined() && !this.isCompleted()); };
    Future.prototype.isSuccess = function () { return this.isCompleted() && this._tryOption.value.isSuccess(); };
    Future.prototype.isFailure = function () { return this.isCompleted() && this._tryOption.value.isFailure(); };
    Future.prototype.map = function (fn) {
        var _this = this;
        if (this.isFailure()) {
            return this;
        }
        else if (this.isSuccess()) {
            var executeFnInNewThread = false;
            return Future.from(function () { return fn(_this.valueOrNull()); }, executeFnInNewThread);
        }
        else
            return Future.fromPromise(new es6_promise_1.Promise(function (resolve, reject) {
                _this.onFailure(function (error) {
                    reject(error);
                });
                _this.onSuccess(function (value) {
                    try {
                        var mappedValue = fn(value);
                        resolve(mappedValue);
                    }
                    catch (error) {
                        reject(error);
                    }
                });
            }));
    };
    Future.prototype.completeBefore = function (obj) {
        var _this = this;
        var timeOutPromiseFn = function () { return new es6_promise_1.Promise(function (resolve, reject) {
            setTimeout(function () {
                try {
                    if (_this.isPending() || _this.isNotYetStarted()) {
                        var timeOutFuture = function () {
                            if (obj.orElse === undefined || obj.orElse == null) {
                                return Future.failed(new Exception_1.TimeOutException("This future took long to be executed, the duration should not have exceeded " + obj.timeOut + "ms"));
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
                        var f = timeOutFuture();
                        resolve(f);
                    }
                }
                catch (error) {
                    reject(error);
                }
            }, obj.timeOut);
        }); };
        var theFuture = function () { return new es6_promise_1.Promise(function (resolve, reject) {
            _this.onComplete(function () { return resolve(_this); });
        }); };
        return (Future
            .fromPromise(es6_promise_1.Promise.race([theFuture(), timeOutPromiseFn()]))
            .flatMap(function (f) { return f; }));
    };
    Future.prototype.filter = function (fn) {
        var _this = this;
        return this.map(function (value) {
            if (fn(value))
                return value;
            else
                throw new Exception_1.NoSuchElementException({
                    message: "No such element error: the future was completed with exception '" + _this._tryOption.value.exception +
                        "' Hence it did not match the predicate in the filter method you have previously called."
                });
        });
    };
    Future.prototype.filterNot = function (fn) {
        return this.filter(function (value) { return !fn(value); });
    };
    Future.prototype.select = function (fn) {
        return this.filter(fn);
    };
    Future.prototype.flatMap = function (fn) {
        var _this = this;
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
            return Future.fromPromise(new es6_promise_1.Promise(function (resolve, reject) {
                _this.onFailure(function (error) {
                    reject(error);
                });
                _this.onSuccess(function (value) {
                    try {
                        fn(value).onComplete({
                            ifSuccess: function (secondValue) {
                                resolve(secondValue);
                            },
                            ifFailure: function (error) {
                                reject(error);
                            }
                        });
                    }
                    catch (error) {
                        reject(error);
                    }
                });
            }));
    };
    Future.prototype.toTryOption = function () { return this._tryOption; };
    Future.prototype.toPromise = function () {
        if (this.isNotYetStarted())
            throw new Exception_1.Exception("Can not transform this Future into a function because this future has not yet started.");
        return this._promiseOption.value;
    };
    Future.prototype.toPromiseOption = function () {
        return this._promiseOption;
    };
    Future.prototype.toArray = function () {
        if (this.isSuccess())
            return [this.valueOrNull()];
        else
            return [];
    };
    Future.prototype.forEach = function (fn) {
        if (this.isSuccess())
            fn(this.valueOrNull());
        else {
            this.completeFunctionSubscribers.push({ ifSuccess: fn });
        }
    };
    Future.prototype.onSuccess = function (fn) {
        if (this.isSuccess())
            fn(this.valueOrNull());
        else {
            this.completeFunctionSubscribers.push({ ifSuccess: fn });
        }
    };
    Future.prototype.onFailure = function (fn) {
        if (this.isFailure())
            fn(this.exceptionOrNull());
        else {
            this.completeFunctionSubscribers.push({ ifFailure: fn });
        }
    };
    Future.prototype.onComplete = function (fn) {
        if (_.isFunction(fn)) {
            var fnAsFunction = fn;
            if (this.isCompleted())
                fnAsFunction();
            else {
                this.completeFunctionSubscribers.push({ whatEver: fnAsFunction });
            }
        }
        else {
            var fnAsObject = fn;
            if (this.isSuccess())
                fnAsObject.ifSuccess(this._tryOption.value.value());
            else if (this.isFailure())
                fnAsObject.ifFailure(this._tryOption.value.exception());
            else {
                this.completeFunctionSubscribers.push(fnAsObject);
            }
        }
    };
    Future.prototype.fold = function (fold) {
        var f2 = fold;
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
    };
    Future.prototype.recover = function (fn) {
        var _this = this;
        if (this.isSuccess()) {
            return this;
        }
        else if (this.isFailure()) {
            var executeFnInNewThread = false;
            return Future.from(function () { return fn(_this.exceptionOrNull()); }, executeFnInNewThread);
        }
        else
            return Future.fromPromise(new es6_promise_1.Promise(function (resolve, reject) {
                _this.onSuccess(function (value) {
                    resolve(value);
                });
                _this.onFailure(function (error) {
                    try {
                        var recoveredValue = fn(error);
                        resolve(recoveredValue);
                    }
                    catch (error) {
                        reject(error);
                    }
                });
            }));
    };
    Future.prototype.delay = function (duration) {
        return this.flatMap(function (r) { return Future.executeAfter(duration, function () { return r; }); });
    };
    Future.prototype.flatRecover = function (fn) {
        var _this = this;
        if (this.isSuccess()) {
            return this;
        }
        else if (this.isFailure()) {
            var executeFnInNewThread = false;
            return Future.fromFuture(function () { return fn(_this.exceptionOrNull()); }, executeFnInNewThread);
        }
        else
            return Future.fromPromise(new es6_promise_1.Promise(function (resolve, reject) {
                _this.onFailure(function (error) {
                    try {
                        fn(error).onComplete({
                            ifFailure: function (error) { return reject(error); },
                            ifSuccess: function (value) { return resolve(value); }
                        });
                    }
                    catch (error) {
                        reject(error);
                    }
                });
                _this.onSuccess(function (value) {
                    resolve(value);
                });
            }));
    };
    Future.prototype.transform = function (transformer) {
        return this.map(transformer).recover(transformer);
    };
    Future.prototype.flatTransform = function (transformer) {
        return this.flatMap(transformer).flatRecover(transformer);
    };
    Future.prototype.start = function () { return this; };
    Future.prototype.isLazy = function () { return false; };
    Future.prototype.toString = function () {
        return (this.fold({
            ifPending: function () { return "Future(Pending)"; },
            ifSuccess: function (value) { return "Future(Success(" + value + "))"; },
            ifFailure: function (exception) { return "Future(Failure(" + exception + "))"; },
            ifNotYetStarted: function () { return "Future(NotYetStarted)"; },
        }));
    };
    return Future;
}());
Future._foreverPending = Future.fromPromise(new es6_promise_1.Promise(function (resolve, reject) { }));
exports.Future = Future;
var FutureCompletedWithValue = (function (_super) {
    __extends(FutureCompletedWithValue, _super);
    function FutureCompletedWithValue(value) {
        return _super.call(this, Option_1.Option.of(es6_promise_1.Promise.resolve(value)), Option_1.Option.of(Try_1.Try.successful(value))) || this;
    }
    FutureCompletedWithValue.prototype.toString = function () { return _super.prototype.toString.call(this); };
    return FutureCompletedWithValue;
}(Future));
var FutureCompletedWithException = (function (_super) {
    __extends(FutureCompletedWithException, _super);
    function FutureCompletedWithException(exception) {
        return _super.call(this, Option_1.Option.of(es6_promise_1.Promise.reject(exception)), Option_1.Option.of(Try_1.Try.failed(exception))) || this;
    }
    FutureCompletedWithException.prototype.toString = function () { return _super.prototype.toString.call(this); };
    return FutureCompletedWithException;
}(Future));
var FutureNotYetStarted = (function (_super) {
    __extends(FutureNotYetStarted, _super);
    function FutureNotYetStarted() {
        return _super.call(this, Option_1.Option.empty(), Option_1.Option.empty()) || this;
    }
    FutureNotYetStarted.prototype.toString = function () { return _super.prototype.toString.call(this); };
    return FutureNotYetStarted;
}(Future));
var LazyFuture = (function (_super) {
    __extends(LazyFuture, _super);
    function LazyFuture(f) {
        var _this = _super.call(this, Option_1.Option.empty(), Option_1.Option.empty()) || this;
        _this.f = f;
        _this.evalFutureOption = Option_1.Option.empty();
        return _this;
    }
    LazyFuture.prototype.evalF = function () {
        if (this.evalFutureOption.isDefined())
            return this.evalFutureOption.value;
        else {
            var evalFuture = this.f().start();
            this.evalFutureOption = Option_1.Option.of(evalFuture);
            return this.init(Option_1.Option.of(evalFuture.toPromise()));
        }
    };
    LazyFuture.prototype.evalFafter = function (duration) {
        var _this = this;
        var future = Future.executeAfter(duration, function () {
            if (_this.evalFutureOption.isDefined())
                return _this.evalFutureOption.value;
            else {
                var evalFuture = _this.f().start();
                _this.evalFutureOption = Option_1.Option.of(evalFuture);
                return _this.init(Option_1.Option.of(evalFuture.toPromise()));
            }
        });
        return future.flatMap(function (f) { return f; });
    };
    LazyFuture.prototype.isLazy = function () { return true; };
    LazyFuture.prototype.toString = function () {
        return (this.fold({
            ifPending: function () { return "LazyFuture(Pending)"; },
            ifSuccess: function (value) { return "LazyFuture(Success(" + value + "))"; },
            ifFailure: function (exception) { return "LazyFuture(Failure(" + exception + "))"; },
            ifNotYetStarted: function () { return "LazyFuture(NotYetStarted)"; },
        }));
    };
    return LazyFuture;
}(Future));
exports.LazyFuture = LazyFuture;
var LazyFutureImpl = (function (_super) {
    __extends(LazyFutureImpl, _super);
    function LazyFutureImpl(f) {
        return _super.call(this, f) || this;
    }
    LazyFutureImpl.prototype.map = function (fn) {
        var _this = this;
        var f = function () { return _this.evalF().map(fn); };
        return Future.lazyFromFuture(f);
    };
    LazyFutureImpl.prototype.filter = function (fn) {
        var _this = this;
        var f = function () { return _this.evalF().filter(fn); };
        return Future.lazyFromFuture(f);
    };
    LazyFutureImpl.prototype.filterNot = function (fn) {
        var _this = this;
        var f = function () { return _this.evalF().filterNot(fn); };
        return Future.lazyFromFuture(f);
    };
    LazyFutureImpl.prototype.select = function (fn) { return this.filter(fn); };
    LazyFutureImpl.prototype.reject = function (fn) { return this.filterNot(fn); };
    LazyFutureImpl.prototype.flatMap = function (fn) {
        var _this = this;
        var f = function () { return _this.evalF().flatMap(fn); };
        return Future.lazyFromFuture(f);
    };
    LazyFutureImpl.prototype.toLazy = function () { return this; };
    LazyFutureImpl.prototype.onSuccess = function (fn) {
        this.evalF().onSuccess(fn);
    };
    LazyFutureImpl.prototype.onFailure = function (fn) {
        this.evalF().onFailure(fn);
    };
    LazyFutureImpl.prototype.onComplete = function (fn) {
        this.evalF().onComplete(fn);
    };
    LazyFutureImpl.prototype.recover = function (fn) {
        var _this = this;
        var f = function () { return _this.evalF().recover(fn); };
        return Future.lazyFromFuture(f);
    };
    LazyFutureImpl.prototype.flatRecover = function (fn) {
        var _this = this;
        var f = function () { return _this.evalF().flatRecover(fn); };
        return Future.lazyFromFuture(f);
    };
    LazyFutureImpl.prototype.transform = function (transformer) {
        var _this = this;
        var f = function () { return _this.evalF().transform(transformer); };
        return Future.lazyFromFuture(f);
    };
    LazyFutureImpl.prototype.flatTransform = function (transformer) {
        var _this = this;
        var f = function () { return _this.evalF().flatTransform(transformer); };
        return Future.lazyFromFuture(f);
    };
    LazyFutureImpl.prototype.completeBefore = function (obj) {
        var _this = this;
        var f = function () { return _this.evalF().completeBefore(obj); };
        return Future.lazyFromFuture(f);
    };
    LazyFutureImpl.prototype.delay = function (duration) {
        return this.flatMap(function (r) { return Future.executeAfter(duration, function () { return r; }); });
    };
    LazyFutureImpl.prototype.forEach = function (fn) {
        this.evalF().forEach(fn);
    };
    LazyFutureImpl.prototype.toString = function () { return _super.prototype.toString.call(this); };
    LazyFutureImpl.prototype.start = function () { return this.evalF(); };
    LazyFutureImpl.prototype.reinitialize = function () { return Future.lazyFromFuture(this.f); };
    LazyFutureImpl.prototype.startAfter = function (duration) { return this.evalFafter(duration); };
    return LazyFutureImpl;
}(LazyFuture));
//# sourceMappingURL=Future.js.map