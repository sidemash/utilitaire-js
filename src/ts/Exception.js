"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
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
        _super.call(this, desc.message || "Generic Exception");
        this.desc = desc;
        this.desc.message = this.message;
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
        _super.call(this, desc.message);
        this.desc = desc;
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
        _super.call(this, message);
    }
    return TimeOutException;
}(Exception));
exports.TimeOutException = TimeOutException;
//# sourceMappingURL=Exception.js.map