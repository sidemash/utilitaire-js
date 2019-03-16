import * as _ from "lodash";
export function onlyReadable(obj) {
    return obj;
}
export function unsafeCast(instance) {
    return instance;
}
export class RemoteObject {
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
export function hasNotOtherwise(fold) {
    return fold.otherwise == undefined;
}
//# sourceMappingURL=TypeUtil.js.map