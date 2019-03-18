"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Exception_1 = require("./Exception");
var Option = (function () {
    function Option() {
    }
    Object.defineProperty(Option.prototype, "value", {
        get: function () { return this._value; },
        enumerable: true,
        configurable: true
    });
    Option.prototype.valueOrElse = function (value) {
        if (this.isDefined())
            return this.value;
        else
            return value;
    };
    Option.prototype.valueOrNull = function () {
        if (this.isDefined())
            return this.value;
        else
            return null;
    };
    Option.prototype.isDefined = function () {
        return this.value != undefined;
    };
    Option.prototype.isEmpty = function () {
        return !this.isDefined();
    };
    Option.prototype.flatMap = function (fn) {
        if (this.isEmpty())
            return exports.None;
        else {
            var resultOption = fn(this.value);
            if (Option.isDefinedValue(resultOption))
                return resultOption;
            else
                return exports.None;
        }
    };
    Option.prototype.map = function (fn) {
        if (this.isDefined())
            return Option.of(fn(this.value));
        else
            return exports.None;
    };
    Option.prototype.filter = function (fn) {
        if (this.isEmpty())
            return exports.None;
        else if (!fn(this.value))
            return exports.None;
        else
            return this;
    };
    Option.prototype.filterNot = function (fn) {
        var notFn = function (el) { return !fn(el); };
        return this.filter(notFn);
    };
    Option.prototype.select = function (fn) {
        return this.filter(fn);
    };
    Option.prototype.reject = function (fn) {
        return this.filterNot(fn);
    };
    Option.prototype.exists = function (fn) {
        return this.filter(fn).isDefined();
    };
    Option.prototype.forEach = function (fn) {
        if (this.isDefined())
            fn(this.value);
    };
    Option.isDefinedValue = function (value) {
        return (value != null && value != undefined);
    };
    Option.of = function (value) {
        if (Option.isDefinedValue(value))
            return new Some(value);
        else
            return exports.None;
    };
    Option.prototype.orElseFilter = function (value, fn) {
        if (this.isEmpty() && Option.isDefinedValue(value) && fn(value))
            return Option.of(value);
        else
            return this;
    };
    Option.prototype.orElse = function (value) {
        if (this.isEmpty())
            return Option.of(value);
        else
            return this;
    };
    Option.filter = function (value, fn) {
        if (Option.isDefinedValue(value) && fn(value))
            return new Some(value);
        else
            return exports.None;
    };
    Option.empty = function () {
        return exports.None;
    };
    return Option;
}());
exports.Option = Option;
var Some = (function (_super) {
    __extends(Some, _super);
    function Some(_value) {
        _super.call(this);
        if (_value == null || _value == undefined)
            throw new Exception_1.Exception("Some constructor expected non null an non undefined value. " +
                _value + "given. " +
                "If you are not sure whether your value is defined or not, please " +
                "consider the static method Option.from<T>(value:T) that will " +
                "deal with the null/undefined case properly.");
        this._value = _value;
    }
    return Some;
}(Option));
exports.Some = Some;
var NoneT = (function (_super) {
    __extends(NoneT, _super);
    function NoneT() {
        _super.apply(this, arguments);
    }
    return NoneT;
}(Option));
exports.None = new NoneT();
//# sourceMappingURL=Option.js.map