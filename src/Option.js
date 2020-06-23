"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Exception_1 = require("./Exception");
class Option {
    get value() { return this._value; }
    valueOrElse(fn) {
        if (this.isDefined())
            return this.value;
        else
            return fn();
    }
    valueOrNull() {
        if (this.isDefined())
            return this.value;
        else
            return null;
    }
    valueOrUndefined() {
        if (this.isDefined())
            return this.value;
        else
            return undefined;
    }
    isDefined() {
        return this.value != undefined;
    }
    isEmpty() {
        return !this.isDefined();
    }
    flatMap(fn) {
        if (this.isEmpty())
            return exports.None;
        else {
            const resultOption = fn(this.value);
            if (Option.isDefinedValue(resultOption))
                return resultOption;
            else
                return exports.None;
        }
    }
    map(fn) {
        if (this.isDefined())
            return Option.of(fn(this.value));
        else
            return exports.None;
    }
    filter(fn) {
        if (this.isEmpty())
            return exports.None;
        else if (!fn(this.value))
            return exports.None;
        else
            return this;
    }
    filterNot(fn) {
        const notFn = (el) => !fn(el);
        return this.filter(notFn);
    }
    select(fn) {
        return this.filter(fn);
    }
    reject(fn) {
        return this.filterNot(fn);
    }
    exists(fn) {
        return this.filter(fn).isDefined();
    }
    forEach(fn) {
        if (this.isDefined())
            fn(this.value);
    }
    static isDefinedValue(value) {
        return (value != null && value != undefined);
    }
    static of(value) {
        if (Option.isDefinedValue(value))
            return new Some(value);
        else
            return exports.None;
    }
    orElseFilter(value, fn) {
        if (this.isEmpty() && Option.isDefinedValue(value) && fn(value))
            return Option.of(value);
        else
            return this;
    }
    orElse(fn) {
        if (this.isEmpty())
            return Option.of(fn());
        else
            return this;
    }
    static filter(value, fn) {
        if (Option.isDefinedValue(value) && fn(value))
            return new Some(value);
        else
            return exports.None;
    }
    static empty() {
        return exports.None;
    }
}
exports.Option = Option;
class Some extends Option {
    constructor(_value) {
        super();
        if (_value == null || _value == undefined)
            throw new Exception_1.Exception("Some constructor expected non null an non undefined value. " +
                _value + "given. " +
                "If you are not sure whether your value is defined or not, please " +
                "consider the static method Option.from<T>(value:T) that will " +
                "deal with the null/undefined case properly.");
        this._value = _value;
    }
    toString() { return `Some(${this._value})`; }
}
exports.Some = Some;
class NoneT extends Option {
    toString() { return "None"; }
}
exports.None = new NoneT();
//# sourceMappingURL=Option.js.map