"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
function onlyReadable(obj) {
    return obj;
}
exports.onlyReadable = onlyReadable;
function unsafeCast(instance) {
    return instance;
}
exports.unsafeCast = unsafeCast;
class RemoteObject {
    constructor(descOrFunction, remote) {
        if (_.isFunction(descOrFunction)) {
            const createDescFromRemote = descOrFunction;
            this.desc = Object.assign({}, remote, createDescFromRemote(remote));
        }
        else {
            const desc = descOrFunction;
            this.desc = desc;
        }
    }
    cloneDesc() {
        return Object.assign({}, this.desc);
    }
}
exports.RemoteObject = RemoteObject;
function hasNotOtherwise(fold) {
    return fold.otherwise == undefined;
}
exports.hasNotOtherwise = hasNotOtherwise;
//# sourceMappingURL=TypeUtil.js.map