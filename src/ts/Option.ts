

import {Exception} from "./Exception";
/**
 * The Option type encapsulates an optional value.
 * A value from type Option<T> either :
 *  - contains a value from type T,
 *  - or it is empty (represented as None).
 *
 * Using Option is a good way to deal with null and undefined.
 */
export abstract class Option<T> {
    protected _value: T;

    /**
     * Returns the option's value.
     * @note The option must be nonEmpty and this will return
     *        undefined if the option is empty.
     */
    get value () : T { return this._value; }

    valueOrElse(value:T): T {
        if(this.isDefined()) return this.value;
        else return value;
    }

    valueOrNull(): T {
        if(this.isDefined()) return this.value;
        else return null;
    }

    isDefined(): boolean {
        return this.value != undefined;
    }

    isEmpty() : boolean {
        return !this.isDefined();
    }

    flatMap<U>(fn:(elem:T) => Option<U>): Option<U> {
        if(this.isEmpty()) return None;
        else {
            const resultOption = fn(this.value);
            if(Option.isDefinedValue(resultOption)) return resultOption;
            else return None;
        }
    }

    map<U>(fn:(elem:T) => U): Option<U> {
        if(this.isDefined()) return Option.of(fn(this.value));
        else return None;
    }

    filter(fn:(elem:T) => boolean): Option<T> {
        if(this.isEmpty()) return None;
        else if(!fn(this.value)) return None;
        else return this;
    }

    filterNot(fn:(elem:T) => boolean): Option<T> {
        const notFn = (el:T) => !fn(el);
        return this.filter(notFn);
    }

    select(fn:(elem:T) => boolean): Option<T> {
        return this.filter(fn);
    }

    reject(fn:(elem:T) => boolean): Option<T> {
        return this.filterNot(fn);
    }

    exists(fn:(elem:T) => boolean): boolean {
        return this.filter(fn).isDefined();
    }

    forEach(fn:(elem:T) => void) {
        if(this.isDefined())
            fn(this.value);
    }

    static isDefinedValue(value:any): boolean {
        return (value != null && value != undefined);
    }

    static of<T>(value : T) : Option<T> {
        // If the provided _value is null or undefined, we let the property
        // _value undefined else we defining it!
        if(Option.isDefinedValue(value)) return new Some(value);
        else return None;
    }

    orElseFilter(value:T, fn:(elem:T) => boolean): Option<T> {
        if(this.isEmpty() && Option.isDefinedValue(value) && fn(value)) return Option.of(value);
        else return this;
    }

    orElse(value:T): Option<T> {
        if(this.isEmpty()) return Option.of(value);
        else return this;
    }

    static filter<T>(value : T, fn:(elem:T) => boolean) : Option<T> {
        // If the provided _value is null or undefined, we let the property
        // _value undefined else we defining it!
        if(Option.isDefinedValue(value) && fn(value)) return new Some(value);
        else return None;
    }

    static empty<T>() : Option<T> {
        return None;
    }
}


export class Some<T> extends Option<T>{

    constructor(_value:T) {
        super();
        if(_value == null || _value == undefined)
            throw new Exception(
                "Some constructor expected non null an non undefined value. " +
                _value + "given. " +
                "If you are not sure whether your value is defined or not, please " +
                "consider the static method Option.from<T>(value:T) that will " +
                "deal with the null/undefined case properly."
            );
        this._value = _value;
    }
}


class NoneT extends Option<typeof undefined> {}

/**
 * Here we use the instance from {}  as instance from None. Indeed, the '{}' can be
 * viewed as an instance from Option because from the Option class definition.
 * as  we did not  defined a '_value' attribute, every call to  the isDefined() method
 * will always yield false. It is then enough to have a correct working Option instance
 * For example see the 'map', and 'foreach' method definition.
 *
 * @type {Option<typeof undefined>}
 */
export const None = new NoneT() as Option<typeof undefined>;
