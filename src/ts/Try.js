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
var Option_1 = require("./Option");
var Future_1 = require("./Future");
var TypeUtil_1 = require("./TypeUtil");
var Exception_1 = require("./Exception");
var Try = (function () {
    function Try() {
    }
    Try.safeApply = function (fn) {
        try {
            var value = fn();
            return Try.successful(value);
        }
        catch (error) {
            return Try.failed(Exception_1.Exception.createFrom(error));
        }
    };
    Try.safeApplyTry = function (fn) {
        try {
            return fn();
        }
        catch (error) {
            return Try.failed(Exception_1.Exception.createFrom(error));
        }
    };
    Try.of = function (fn) {
        return Try.safeApply(function () { return fn(); });
    };
    Try.failed = function (exception) {
        return new Failure(exception);
    };
    Try.successful = function (value) {
        return new Success(value);
    };
    Try.prototype.isSuccess = function () {
        return (this._value != undefined);
    };
    Try.prototype.isFailure = function () {
        return !this.isSuccess();
    };
    Try.prototype.valueOrElse = function (other) {
        if (this.isSuccess())
            return this._value;
        else
            return other;
    };
    Try.prototype.valueOrNull = function () {
        if (this.isSuccess())
            return this._value;
        else
            return null;
    };
    Try.prototype.value = function () {
        if (this.isSuccess())
            return this._value;
        else
            throw this._exception;
    };
    Try.prototype.exception = function () {
        if (this.isFailure())
            return this._exception;
        else
            throw new Exception_1.Exception("Attempting to get an exception for a successful Try");
    };
    Try.prototype.exceptionOrElse = function (other) {
        if (this.isFailure())
            return this._exception;
        else
            return other;
    };
    Try.prototype.exceptionOrNull = function () {
        if (this.isFailure())
            return this._exception;
        else
            return null;
    };
    Try.prototype.toOption = function () {
        if (this.isSuccess())
            return Option_1.Option.of(this._value);
        else
            return Option_1.Option.empty();
    };
    Try.prototype.toFuture = function () {
        return Future_1.Future.fromTry(this);
    };
    Try.prototype.forEach = function (fn) {
        if (this.isSuccess())
            fn(this._value);
    };
    Try.prototype.map = function (fn) {
        var _this = this;
        if (this.isSuccess())
            return Try.of(function () { return fn(_this._value); });
        else {
            return this;
        }
    };
    Try.prototype.select = function (fn) { return this.filter(fn); };
    Try.prototype.filter = function (fn) {
        var _this = this;
        if (this.isFailure())
            return this;
        else {
            Try.safeApplyTry(function () {
                if (fn(_this._value))
                    return _this;
                else {
                    return Try.failed(new Exception_1.NoSuchElementException({
                        message: "No such element exception: the value '" + _this._value +
                            "' did not match the predicate in on the filter method you have previously called"
                    }));
                }
            });
        }
    };
    Try.prototype.recover = function (fn) {
        var _this = this;
        if (this.isSuccess())
            return this;
        else if (this.isFailure())
            return Try.of(function () { return fn(_this._exception); });
    };
    Try.prototype.flatRecover = function (fn) {
        var _this = this;
        if (this.isSuccess())
            return this;
        else if (this.isFailure())
            return Try.safeApplyTry(function () { return fn(_this._exception); });
    };
    Try.prototype.flatMap = function (fn) {
        var _this = this;
        if (this.isSuccess())
            return Try.safeApplyTry(function () { return fn(_this._value); });
        else if (this.isFailure())
            return TypeUtil_1.unsafeCast(this);
    };
    Try.prototype.transform = function (trans) {
        var _this = this;
        if (this.isSuccess())
            return Try.safeApplyTry(function () { return trans.ifSuccess(_this._value); });
        else
            return Try.safeApplyTry(function () { return trans.ifFailure(_this._exception); });
    };
    Try.prototype.fold = function (fold) {
        if (this.isSuccess())
            return fold.ifSuccess(this._value);
        else
            return fold.ifFailure(this._exception);
    };
    return Try;
}());
exports.Try = Try;
var Success = (function (_super) {
    __extends(Success, _super);
    function Success(value) {
        var _this = _super.call(this) || this;
        _this._value = value;
        return _this;
    }
    return Success;
}(Try));
var Failure = (function (_super) {
    __extends(Failure, _super);
    function Failure(exception) {
        var _this = _super.call(this) || this;
        _this._exception = exception;
        return _this;
    }
    return Failure;
}(Try));
//# sourceMappingURL=Try.js.map