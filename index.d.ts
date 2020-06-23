
declare module "utilidade" {


    export abstract class Option<T> {
        protected _value: T;
        readonly value: T;
        valueOrElse(fn: () => T): T;
        valueOrNull(): T;
        valueOrUndefined(): T;
        isDefined(): boolean;
        isEmpty(): boolean;
        flatMap<U>(fn: (elem: T) => Option<U>): Option<U>;
        map<U>(fn: (elem: T) => U): Option<U>;
        filter(fn: (elem: T) => boolean): Option<T>;
        filterNot(fn: (elem: T) => boolean): Option<T>;
        select(fn: (elem: T) => boolean): Option<T>;
        reject(fn: (elem: T) => boolean): Option<T>;
        exists(fn: (elem: T) => boolean): boolean;
        forEach(fn: (elem: T) => void): void;
        static isDefinedValue(value: any): boolean;
        static of<T>(value: T): Option<T>;
        orElseFilter(value: T, fn: (elem: T) => boolean): Option<T>;
        orElse(fn: () => T): Option<T>;
        static filter<T>(value: T, fn: (elem: T) => boolean): Option<T>;
        static empty<T>(): Option<T>;
    }
    export class Some<T> extends Option<T> {
        constructor(_value: T);
        toString(): string;
    }
    export const None: Option<any>;
    
    export type VoidFunction = () => void;
    export type OnComplete<T> = {
        ifSuccess?: (result: T) => void;
        ifFailure?: (exception: Exception) => void;
        whatEver?: () => void;
    };
    export class Future<T> {
        protected _promiseOption: Option<Promise<T>>;
        protected _tryOption: Option<Try<T>>;
        protected constructor(_promiseOption: Option<Promise<T>>, _tryOption: Option<Try<T>>);
        protected init(promiseOption: Option<Promise<T>>): Future<T>;
        static foreverPending<T>(): Future<T>;
        static neverCompleted<T>(): Future<T>;
        static all<T>(futures: Array<Future<T>>): Future<Array<T>>;
        static firstCompletedOf<T>(futures: Array<Future<T>>): Future<T>;
        static lastCompletedOf<T>(futures: Array<Future<T>>): Future<T>;
        static lazyFrom<T>(f: () => T): LazyFuture<T>;
        static lazyFromFuture<T>(f: () => Future<T>): LazyFuture<T>;
        static lazyFromPromise<T>(promise: Promise<T>): LazyFuture<T>;
        static lazyFromPromiseFn<T>(fn: () => Promise<T>): LazyFuture<T>;
        static fromPromiseFn<T>(fn: () => Promise<T>): Future<T>;
        static fromPromise<T>(promise: Promise<T>): Future<T>;
        static startAfter<T>(timeout: number, fn: () => Future<T>): Future<T>;
        static executeAfter<T>(timeout: number, fn: () => T): Future<T>;
        static from<T>(fn: () => T, executeFnInNewThread?: boolean): Future<T>;
        static fromFuture<T>(fn: () => Future<T>, executeFnInNewThread?: boolean): Future<T>;
        static fromTry<T>(t: Try<T>): Future<T>;
        static successful<T>(value: T): Future<T>;
        static successfulWithVoid(): Future<void>;
        static failed<T>(exception: Exception): Future<T>;
        static notYetStarted<T>(): Future<T>;
        valueOrNull(): T;
        valueOption(): Option<T>;
        toLazy(): LazyFuture<T>;
        exceptionOrNull(): Exception;
        isCompleted(): boolean;
        isNotYetStarted(): boolean;
        isPending(): boolean;
        isSuccess(): boolean;
        isFailure(): boolean;
        map<U>(fn: (result: T) => U): Future<U>;
        completeBefore(obj: {
            timeOut: number;
            orElse?: () => Future<T>;
        }): Future<T>;
        filter(fn: (res: T) => boolean): Future<T>;
        filterNot(fn: (res: T) => boolean): Future<T>;
        select(fn: (res: T) => boolean): Future<T>;
        flatMap<U>(fn: (result: T) => Future<U>): Future<U>;
        toTryOption(): Option<Try<T>>;
        toPromise(): Promise<T>;
        toPromiseOption(): Option<Promise<T>>;
        toArray(): Array<T>;
        forEach(fn: (res: T) => void): void;
        onSuccess(fn: (res: T) => void): void;
        onFailure(fn: (exception: Exception) => void): void;
        onComplete(fn: VoidFunction | {
            ifSuccess: (result: T) => void;
            ifFailure: (exception: Exception) => void;
        }): void;
        fold<U>(fold: {
            ifPending: () => U;
            ifNotYetStarted: () => U;
            ifSuccess: (result: T) => U;
            ifFailure: (exception: Exception) => U;
        } | {
            otherwise: () => U;
            ifPending?: () => U;
            ifNotYetStarted?: () => U;
            ifSuccess?: (result: T) => U;
            ifFailure?: (exception: Exception) => U;
        }): U;
        recover(fn: (exception: Exception) => T): Future<T>;
        delay(duration: number): Future<T>;
        flatRecover(fn: (exception: Exception) => Future<T>): Future<T>;
        transform<U>(transformer: () => U): Future<U>;
        flatTransform<U>(transformer: () => Future<U>): Future<U>;
        start(): Future<T>;
        isLazy(): boolean;
        toString(): string;
    }
    export abstract class LazyFuture<T> extends Future<T> {
        protected readonly f: () => Future<T>;
        protected constructor(f: () => Future<T>);
        protected evalF(): Future<T>;
        protected evalFafter(duration: number): Future<T>;
        isLazy(): boolean;
        toString(): string;
    }
    
    export abstract class Try<T> {
        protected _value: T;
        protected _exception: Exception;
        protected static safeApply<Result>(fn: () => Result): Try<Result>;
        protected static safeApplyTry<T>(fn: () => Try<T>): Try<T>;
        static of<T>(fn: () => T): Try<T>;
        static failed<T>(exception: Exception): Try<T>;
        static successful<T>(value: T): Try<T>;
        isSuccess(): boolean;
        isFailure(): boolean;
        valueOrElse(fn: () => T): T;
        valueOrNull(): T;
        value(): T;
        exception(): Exception;
        exceptionOrElse(other: Exception): Exception;
        exceptionOrNull(): Exception;
        toOption(): Option<T>;
        toFuture(): Future<T>;
        forEach(fn: (result: T) => void): void;
        map<U>(fn: (result: T) => U): Try<U>;
        select(fn: (result: T) => boolean): Try<T>;
        filter(fn: (result: T) => boolean): Try<T>;
        recover(fn: (exception: Exception) => T): Try<T>;
        flatRecover(fn: (exception: Exception) => Try<T>): Try<T>;
        flatMap<U>(fn: (result: T) => Try<U>): Try<U>;
        transform<U>(trans: {
            ifSuccess: (result: T) => Try<U>;
            ifFailure: (exception: Exception) => Try<U>;
        }): Try<U>;
        fold<U>(fold: {
            ifSuccess: (result: T) => U;
            ifFailure: (exception: Exception) => U;
        }): U;
    }
    
    export function onlyReadable<T extends JsObject>(obj: T): OnlyReadable<T>;
    export function unsafeCast<A, B>(instance: A): B;
    export type OnlyReadable<T> = {
        readonly [P in keyof T]: T[P];
    };
    export interface HasId<T> {
        id: string;
    }
    export interface Splittable<T, U> {
        split(): Array<U>;
    }
    export interface Mergeable<T, U> {
        merge(other: Array<U>): T;
    }
    export interface UpdatableInPlace<T, U> {
        updateInPlace(desc: U): T;
    }
    export interface Copyable<T, U> {
        copy(desc: Partial<U>): T;
    }
    export interface Updatable<T, U> {
        update(desc: Partial<U>): T;
    }
    export type JsObject = {
        [propName: string]: any;
    };
    export type Union2<T1, T2> = T1 | T2;
    export type Function1<T1, R> = (T1: any) => R;
    export type Otherwise<T> = {
        otherwise: T;
    };
    export type OtherwisePartial<T, U> = Partial<U> & Otherwise<T>;
    export type OtherwiseUnion<Otherwise, U> = U | OtherwisePartial<Otherwise, U>;
    export function hasNotOtherwise<T, U>(fold: OtherwiseUnion<() => T, U>): fold is U;
    
    export type ExceptionDesc = {
        message: string;
    };
    export class Exception {
        message: string;
        constructor(message: string);
        static createFrom(e: any): Exception;
    }
    export type DefaultExceptionDesc = {
        message?: string;
        cause: any;
    };
    export class GenericException extends Exception {
        protected desc: DefaultExceptionDesc;
        constructor(desc: DefaultExceptionDesc);
        readonly cause: any;
    }
    export class NoSuchElementException extends Exception {
        protected desc: ExceptionDesc;
        constructor(desc: ExceptionDesc);
        readonly message: any;
    }
    export class TimeOutException extends Exception {
        constructor(message: string);
    }
    }