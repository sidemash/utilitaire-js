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
var Exception = (function () {
    function Exception(message) {
        this.message = message;
    }
    Exception.createFrom = function (e) {
        if (e instanceof Exception)
            return e;
        else
            return new GenericException({ cause: e });
    };
    return Exception;
}());
exports.Exception = Exception;
var GenericException = (function (_super) {
    __extends(GenericException, _super);
    function GenericException(desc) {
        var _this = _super.call(this, desc.message || "Generic Exception") || this;
        _this.desc = desc;
        _this.desc.message = _this.message;
        return _this;
    }
    Object.defineProperty(GenericException.prototype, "cause", {
        get: function () { return this.desc.cause; },
        enumerable: true,
        configurable: true
    });
    return GenericException;
}(Exception));
exports.GenericException = GenericException;
var NoSuchElementException = (function (_super) {
    __extends(NoSuchElementException, _super);
    function NoSuchElementException(desc) {
        var _this = _super.call(this, desc.message) || this;
        _this.desc = desc;
        return _this;
    }
    Object.defineProperty(NoSuchElementException.prototype, "message", {
        get: function () { return this.desc.message; },
        enumerable: true,
        configurable: true
    });
    return NoSuchElementException;
}(Exception));
exports.NoSuchElementException = NoSuchElementException;
var TimeOutException = (function (_super) {
    __extends(TimeOutException, _super);
    function TimeOutException(message) {
        return _super.call(this, message) || this;
    }
    return TimeOutException;
}(Exception));
exports.TimeOutException = TimeOutException;
//# sourceMappingURL=Exception.js.map