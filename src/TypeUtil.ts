export function onlyReadable<T extends JsObject>(obj : T) : OnlyReadable<T> {
    return obj as any as OnlyReadable<T>;
}

export function unsafeCast<A,B>(instance:A) : B {
    return (instance as any ) as B;
}

export type OnlyReadable<T> = {
    readonly [P in keyof T] : T[P];
};

export interface HasId<T> {
    id : string
}

export interface Splittable<T, U> {
    split() : Array<U>;
}

export interface Mergeable<T, U> {
    merge(other:Array<U>) : T;
}

export interface UpdatableInPlace<T, U> {
    updateInPlace(desc:U) : T
}


export interface Copyable<T, U> {
    copy(desc:Partial<U>) : T;
}

export interface Updatable<T, U> {
    update(desc:Partial<U>) : T;
}

/**
 * A JsObject is a definition from Json that is not a
 * primitive value nor an array : Structural defined object
 */
export type JsObject = {
    [propName: string]: any;
}


export type Union2<T1,T2> = T1 | T2

export type Function1<T1,R> = (T1) => R

export type Otherwise<T> = {
    otherwise : T
}
export type OtherwisePartial<T, U> = Partial<U> & Otherwise<T>
export type OtherwiseUnion<Otherwise, U> = U | OtherwisePartial<Otherwise, U>

export function hasNotOtherwise<T, U>(fold : OtherwiseUnion<() => T, U> ) : fold is U {
    return (<Otherwise<() => T>>fold).otherwise == undefined;
}