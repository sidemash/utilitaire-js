# utilitaire-js
Set of utils Tools for Typescript mainly to enhance Promise API

# Future 
This type is meant to be used as Promises, so when you see Future<T>, think "Promise<T> with additionals behaviors having 4 states : NotYetStarted, Pending, Successful, Failed"

## Usage Example 
### 1 - Defining Fallback
```typescript
// Starting by importing Future 
import {Future} from "utilitaire";

// Let the following type represent a User.
type User = { name : string }
const getUserFromServer1 : () => User = // Assume this is defined somehow long computation
const getUserFromServer2 : () => User = // Assume this is defined somehow long computation

// So we can do the following : 
Future.from(getUserFromServer1)            // Create a Future by Trying to get user from Server1. we have Future<User>
    .completeBefore({ timeOut : 3000 })    // This attempt should be completed before 3s get elapsed. we have Future<User>
    .recover(exception => {})              // If this attempt fails, we recover from failure ignoring the exception. now we have Future<void>
    .delay({ duration : 1000 })            // We will then wait 1s. We still have Future<void>
    .map(ignored => getUserFromServer2())  // (map is almost like then)  And we will try again to get user from Server2. Now we have Future<User>
    .onComplete({
        ifSuccess : user => console.log("Returned User From Server " + user.name), 
        ifFailure : exception  => console.log("An exception Occured " + exception.toString())
    })
```


### 2 - Delaying execution and Retrying
You will see why the Future can be in a NotYetStarted state.
```typescript
import {LazyFuture} from "utilitaire";

const lazyFuture : LazyFuture<User> = 
                Future.lazyFrom(() => getUserFromServer1())
                    .completeBefore({ timeOut : 3000 })
                    .recover(exception => {})
                    .delay({ duration : 1000 })
                    .map(ignored => getUserFromServer2())
// The lazy future previously created is not yet executed 
// We can pass it around as parameters

// We can also execute it 
lazyFuture.start(); // Return Future<User>
lazyFuture.start(); // Won't retry as it already have been evaluated

// We can also execute it after 3seconds
lazyFuture.startAfter({ duration : 3000 }) // Return Future<User>

// We can also retry all of previously defined computations
lazyFuture.reinitialize(); // Return a new LazyFuture<User> Reset to its initial State
lazyFuture.reinitialize().start()   // Return a new LazyFuture<User> Reset to 
                                    // its initial State start it and Return Future<User>

``` 



### 3 - Rendering Promise inside React component
There exists in Future class a method called fold that will "open and see in" the future and following the state, a computation will append with the value inside the future object if any 
```typescript jsx
// Here is the render we can write with the fold method 
render() {
    const getUserFromServerFuture : Future<User> = ... // Assume we have a future fetching the user from Server
    return (
        <div>
            {
                getUserFromServerFuture.fold({ // fold method will "open and see in" the future
                    ifSuccess : user => 	     <span>Hello {user.name}</span>,
                    ifFailure : exception => <span>An Error Occured</span>,
                    otherwise : () =>        <Loading />
                })
            }
        </div>
    ); 
} 
```
3 - Others methods availables

|                      | ```Promise<T>```                                                                                                                                                                                                                                                | ```Future<T> ```                                                                                                                                                                                                                                                |
|----------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Query Internal State | None                                                                                                                                                                                                                                                      | ```future.isCompleted()``` <br>  ```future.isNotYetStarted()``` <br>  ```future.isPending()``` <br>  ```future.isSuccess()``` <br>  ```future.isFailure()``` |
| Pull the value out      | None                                                                                                                                                                                                                                                      | ```future.valueOrNull()``` <br>  ```future.exceptionOrNull()```|
| Transform            | ```then<U>(fn : T => U) : Promise<U>```<br> ```then<U>(fn : T => Promise<U>):Promise<U>``` <br> 	```catch<U>(fn : any => U) : Promise<U>``` <br>  ```catch<U>(fn : any => Promise<U>):Promise<U>``` <br>  ```finally<U>(fn : () => U) : Promise<U>``` <br>  ```finally<U>(fn : () => Promise<U>):Promise<U>```  | ```map<U>(fn : T => U) : Future<U> ``` <br>  ```flatMap<U>(fn : T => Future<U>): Future<U>``` <br>  ```recover<U>(fn : T => U) : Future<U>``` <br>  ```flatRecover<U>(fn : T => Future<U>) : Future<U>``` <br>  ```transform<U>(fn: () => U): Future<U>``` <br>  ```flatTransform<U>(fn: () => Future<U>): Future<U>``` |
| Timeout / Delay      | None  | ```delay(obj : { duration: number }): Future<T>``` <br>  ```completeBefore(obj:{ timeOut: number }):Future<T>``` |
| Callback             | None | ```onComplete(fn : () => void): void ``` <br> ```onSuccess(fn : T => void) : void``` <br>  ```onFailure(fn: Exception => void): void```|
| Static Method Creation | ```Promise.resolve<T>(value:T) : Promise<T>```<br> ```Promise.reject<T>(exception:any): Promise<T>``` | ```Future.successful<T>(value:T): Future<T>```<br> ```Future.failed<T>(exception:Exception): Future<T>```<br> ```Future.foreverPending<T>() : Future<T>```<br> ```Future.notYetStarted<T>(): Future<T>```                                                                                                                                                                  |
| Static Method Helpers   | ```Promise.all<T>(promises:Array<Promise<T>>): Promise<Array<T>>```<br> ```Promise.race<T>(promises:Array<Promise<T>>): Promise<T>```  | ```Future.all<T>(futures: Array<Future<T>>): Future<Array<T>>```<br> ```Future.firstCompletedOf<T>(futures: Array<Future<T>>): Future<T>```<br> ```Future.lastCompletedOf<T>(futures: Array<Future<T>>): Future<T>```<br> ```Future.startAfter<T>(timeout:number, fn : () => Future<T>) : Future<T>```<br> ```Future.executeAfter<T>(timeout:number, fn : () => T) : Future<T>``` |

// TODO 
## Motivation  
## Nomenclature  
### Why naming flatMap / flatRecover / flatTransform ?
### Why naming map instead of then ?
## Expression oriented
