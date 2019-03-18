# utilitaire-js
Set of utils Tools for Typescript mainly to enhance Promise API

# Dependencies
- lodash 
- immutable 
- es6-promise

# Future 
This `Future` type is meant to be used as `Promise`, so when you see `Future<T>`, think "`Promise<T>` with additionals behaviors having 4 states : `NotYetStarted`, `Pending`, `Successful`, `Failed`"

## Usages Examples 
### Use Case 1 - Defining Fallback
```typescript
// Starting by importing Future 
import {Future} from "utilitaire";

// Let the following type represent a User.
type User = { name : string }
const getUserFromServer1 : () => User = // Assume this is defined somehow long computation
const getUserFromServer2 : () => User = // Assume this is defined somehow long computation

// So we can do the following : 
Future.from(getUserFromServer1)            // -> Return Future<User> : Create a Future by Trying to get user from Server1.
    .completeBefore({ timeOut : 3000 })    // -> Return Future<User> : This attempt should be completed before 3s get elapsed
    .recover(exception => {})              // -> Return Future<void> : If this attempt fails, we recover from failure ignoring the exception.
    .delay({ duration : 1000 })            // -> Return Future<void> : We will then wait 1s. We still have Future<void>
    .map(ignored => getUserFromServer2())  // -> Return Future<User> : (`map` is almost like `then`) And we will try again to get user from Server2.
    .onComplete({
        ifSuccess : user => console.log("Returned User From Server " + user.name), 
        ifFailure : exception  => console.log("An exception Occured " + exception.toString())
    })
```
<br>

### Use Case 2 - Delaying execution and Retrying
You will see why the Future can be in a `NotYetStarted` state: In fact it is its initial state.
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

<br>

### Use Case 3 - Rendering Promise inside React component
There exists in `Future` class a method called `fold` that will "open and see in" the future and following the current state of the future, a computation will append with the value inside the future object if any 
```typescript jsx
// Here is the render we can write with the fold method 
render() {
    const getUserFromServerFuture : Future<User> = ... // Assume we have a future fetching the user from Server
    return (
        <div>
            {
                getUserFromServerFuture.fold({ // fold method will "open and see in" the future
                    ifSuccess : user => <span>Hello {user.name}</span>,
                    ifFailure : exception => <span>An Error Occured</span>,
                    otherwise : () => <Loading />
                })
            }
        </div>
    ); 
} 
```

<br>

### 4 - Comparison with Promise API

|                       ```Promise<T>```                                                                                                                                                                                                                                                | ```Future<T> ```                                                                                                                                                                                                                                                |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|                                       ||
| Query Internal State                  ||
| None                                                                                                                                                                                                                                                      | ```future.isCompleted()``` <br>  ```future.isNotYetStarted()``` <br>  ```future.isPending()``` <br>  ```future.isSuccess()``` <br>  ```future.isFailure()``` |
| Pull the value out                    ||   
| None                                                                                                                                                                                                                                                      | ```future.valueOrNull()``` <br>  ```future.exceptionOrNull()```|
| Transform                             ||
| ```then<U>(fn : T => U) : Promise<U>```<br> ```then<U>(fn : T => Promise<U>):Promise<U>``` <br> <br> 	```catch<U>(fn: any => U):Promise<U>``` <br>  ```catch<U>(fn: any => Promise<U>):Promise<U>``` <br><br> ```finally<U>(fn: () => U):Promise<U>``` <br>  ```finally<U>(fn: () => Promise<U>):Promise<U>```  | ```map<U>(fn : T => U) : Future<U> ``` <br>  ```flatMap<U>(fn : T => Future<U>): Future<U>``` <br><br>   ```recover<U>(fn : T => U) : Future<U>``` <br>  ```flatRecover<U>(fn : T => Future<U>) : Future<U>``` <br><br>   ```transform<U>(fn: () => U): Future<U>``` <br>  ```flatTransform<U>(fn: () => Future<U>): Future<U>``` |
| Timeout / Delay                       ||
| None  | ```delay(obj : { duration: number }): Future<T>``` <br>  ```completeBefore(obj:{ timeOut: number }):Future<T>``` |
| Callback                              || 
| None (but can be simulated with then/catch/finally) | ```onComplete(fn : () => void): void ``` <br> ```onSuccess(fn : T => void) : void``` <br>  ```onFailure(fn: Exception => void): void```|
| Static Method Creation                ||
| ```Promise.resolve<T>(value:T) : Promise<T>```<br> ```Promise.reject<T>(exception:any):Promise<T>``` <br><br><br>  | ```Future.successful<T>(value:T): Future<T>```<br> ```Future.failed<T>(exception:Exception): Future<T>```<br> ```Future.foreverPending<T>() : Future<T>```<br> ```Future.notYetStarted<T>(): Future<T>```                                                                                                                                                                  |
| Static Method Helpers                 ||
|  ```Promise.all<T>(promises:[Promise<T>]):Promise<[T]>```<br> ```Promise.race<T>(promises:[Promise<T>]): Promise<T>``` <br><br> <br> <br>  <br> <br>  | ```Future.all<T>(futures: [Future<T>]): Future<[T]>```<br> ```Future.firstCompletedOf<T>(futures: [Future<T>]): Future<T>```<br> ```Future.lastCompletedOf<T>(futures:[Future<T>]):Future<T>```<br> ```Future.startAfter<T>(timeout:number,``` <br> &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; ```fn: () => Future<T>):Future<T>```<br> ```Future.executeAfter<T>(timeout:number,```  <br> &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;```fn: () => T):Future<T>``` |

 
## Nomenclature  
<br>

### Why not using catch/then/finally ?
Because `catch` is a reserved keyword, we choose NOT to try to force the definition of a method named `catch`. 
Hence we did not choose `then` because we knew that `catch` won't be available. If a `then` method were defined, it would have been weird if
the catch method were missing. The same goes for ``finally`` reserved keyword.

<br>

### Why naming map instead of then ?
What does the `map` allows you to do ? 
Create a new data structure by opening you current data structure and apply a function on every items inside of it.
```typescript 
Array(1, 2, 3).map(i => i + 1) // Create a new Array starting from the current Array and applying a function to every elements inside of it 
Future(1).map(i => i + 1)      // Create a new Future starting from the current Future and applying a function to every elements inside of it 
```
NB : See this link for some [theorical resource](https://en.wikipedia.org/wiki/Map_(higher-order_function))
about the map function.
<br>

### Why naming flatMap / flatRecover / flatTransform ?
We all know the `map`function defined in array 
```typescript 
const array1 = Array(1, 2, 3).map(i => i * 2)   // Return Array(2, 4, 6) 
const array2 = Array(1, 2, 3).map(i => { num : i })   // Return Array({num : 1}, {num : 2}, {num : 3}) 
```

Now Assume we have the `flatMap` method defined on `Array` by this behaviour : 
```typescript 
const array3 = Array(1, 2, 3).flatMap(i => Array(i, i))   // Return Array(1, 1, 2, 2, 3, 3)
```

If We use the `map` function defined in Array, with the same argument as `flatMap` function previously defined , ie `i => Array(i, i)`,  we will have the following result
```typescript 
const array4 = Array(1, 2, 3).map(i => Array(i, i))   // Return Array(Array(1, 1), Array(2, 2), Array(3, 3)) 
```

Now assume we have the `flatten` method defined on `Array` by this behaviour : 
```typescript 
const array5 = Array(Array(1)).flatten             // Return Array(1)
const array6 = Array(Array(1), Array(2)).flatten   // Return Array(1, 2)
```

So to get what we get in array1, we have to "flatten" the array2
```typescript 
// array3 == array4.flatten 
// because array4 = Array(1, 2, 3).map(i => Array(i, i)) 
// array3F == Array(1, 2, 3).map(i => Array(i, i)).flatten 
```
We then have the nomenclature **FlatMap**  means **map and then flatten**
The same pattern goes for Set, List, and Future and we could define `flatMap` such as 
```typescript 
// Set(1).flatMap(i => Set(i + 1))          // Return Set(2)
// List(1).flatMap(i => List(i + 1))        // Return List(2)
// Future(1).flatMap(i => Future(i + 1))    // Return Future(2)
// and so one....
```
<br> 

NB : With this `flatMap` operations and others functions having some other properties, the `Future` Data structure is a [Monad](https://en.wikipedia.org/wiki/Monad_(functional_programming))

<br>
