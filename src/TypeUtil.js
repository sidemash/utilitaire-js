"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function onlyReadable(obj) {
    return obj;
}
exports.onlyReadable = onlyReadable;
function unsafeCast(instance) {
    return instance;
}
exports.unsafeCast = unsafeCast;
function hasNotOtherwise(fold) {
    return fold.otherwise == undefined;
}
exports.hasNotOtherwise = hasNotOtherwise;
//# sourceMappingURL=TypeUtil.js.map