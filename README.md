# utilitaire-js
Set of utils Tools for Typescript mainly to enhance Promise API

# Future 
This type is meant to be used as Promises, so when you see Future<T>, think "Promise<T> with additionals behaviors having 4 states : NotYetStarted, Pending, Successful, Failed"

## Usage Example 
1 - Defining Retry 
```typescript
import {Future} from "utilitaire";
import {Promise} from "es6-promise"; 

// Let the following type represent a User.
type User = { name : string }
const getUserFromServer1 : () => Promise<User> = // Assume this is defined somehow

// So we can do the following : 
Future.fromPromise(getUserFromServer1())    // Create a Future by Trying to get user from Server1. we have Future<User>
    .completeBefore({ timeOut : 3000 })		// This attempt should be completed before 3s get elapsed. we have Future<User>
    .recover(exception => {})				// If this attempt fails, we recover from failure ignoring the exception. now we have Future<void>
    .delay({ duration : 1000 })				// We will then wait 1s. We still have Future<void>
    .map(ignored => getUserFromServer1())   // And then we will try again to get user from Server1 again. Now we have Future<User>
    .onComplete({
        ifSuccess : user => console.log("Returned User From Server " + user.name), 
        ifFailure : exception  => console.log("An exception Occured " + exception.toString())
    })
```

2 - Rendering Promise inside React component : the fold method
There exists in Future class a method called fold that will "open and see in" the future and following the state, a computation will append with the value inside the future object if any 
```typescript
// Imagine we are in the render of a React.Component that display the fetching of a user from server 
// Here is the render we can write with the fold method 
    render() {
        const getUserFromServerFuture : Future<User> = ... // Assume we have a future fetching the user from Server
        return (
            <div>
                {
                    getUserFromServerFuture.fold({
                        ifSuccess : user => 	 <span>Hello {user.name}</span>,
                        ifFailure : exception => <span>An Error Occured</span>,
                        otherwise : () =>        <Loading />
                    })
                }
            </div>
        ); 
    } 
```
3 - Others methods available
- Query State 
		promise.isCompleted
		promise.isNotYetStarted 
		promise.isPending 
		promise.isSuccess
		promise.isFailure
	- Get value out
		promise.exceptionOrNull
		promise.valueOrNull
	- Transform
		promise.fold 
		promise.map 
		promise.flatMap 
		promise.recover
		promise.recoverWith 
		promise.transform
		promise.transformWith  
	- Timeout / Delay 
		promise.completeBefore
		promise.delay 
	- CallBack 
		promise.onComplete()
		promise.onSuccess 
		promise.onFailure
		
## Motivation  
## nomenclature  
## expression oriented
## many methods  
When you have a promise object, is it possible to know if it is completed ? 
```javascript
// given a promise : Promise<any> 
if(promise.isCompleted()){
    // do something 
} 
```
Sure you can managed and find a way to do this but it could have been nice if the promise 