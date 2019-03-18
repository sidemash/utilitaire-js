"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require("lodash");
function onlyReadable(obj) {
    return obj;
}
exports.onlyReadable = onlyReadable;
function unsafeCast(instance) {
    return instance;
}
exports.unsafeCast = unsafeCast;
var RemoteObject = (function () {
    function RemoteObject(descOrFunction, remote) {
        if (_.isFunction(descOrFunction)) {
            var createDescFromRemote = descOrFunction;
            this.desc = Object.assign({}, remote, createDescFromRemote(remote));
        }
        else {
            var desc = descOrFunction;
            this.desc = desc;
        }
    }
    RemoteObject.prototype.cloneDesc = function () {
        return Object.assign({}, this.desc);
    };
    return RemoteObject;
}());
exports.RemoteObject = RemoteObject;
function hasNotOtherwise(fold) {
    return fold.otherwise == undefined;
}
exports.hasNotOtherwise = hasNotOtherwise;
//# sourceMappingURL=TypeUtil.js.map