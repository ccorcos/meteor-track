# How does [Tracker](http://docs.meteor.com/#/full/tracker) work?

Tracker builds a graph of function dependancies. Lets checkout an example:

```js
a = new ReactiveVar(0)
b = new ReactiveVar(0)
b = new ReactiveVar(0)
Tracker.autorun(function() {
  // c = a + b
  c.set(a.get() + b.get())
})
```

`Tracker.autorun` basically just runs a function, making note of which function is currently being run. Something like this:

```js
Tracker.prototype.autorun = function(func) {
  var prev = this.current
  this.current = func
  func()
  this.current = prev
}
```

The rest of the magic happens within the `ReactiveVar`. Whenever `.get` is called, we make note that the current function depends on this value so when the value changes with `.set`, we can re-run the dependant functions. `.get` and `.set` look something like this:

```js
ReactiveVar.prototype.get = function() {
  this.dependancies.push(Tracker.current)
  return this.value
}

ReactiveVar.prototype.set = function(x) {
  this.value = x
  this.dependancies.map(function(func) { func() })
}
```

Now, there are certainly some edge cases we didn't cover here. [So **check out the example**](/client/main.js) for a functional implementation that more closely models how Tracker actually works. 

# What else is left?

- The flush cycle!

    When `.set` is called and the dependancies are re-run, the functions are actually queued up and run all at once when the thread is free, using a `setTimeout(..., 0)`. Using our example, if we have a function:

    ```js
    var f = function() {
      a.set(1)
      b.set(2)
    }
    ```

    The autorun that calls `c.set` should only be re-run only once to prevent unnecessary work.

- Some helpful callbacks like `onInvalidate` and `afterFlush`.

    Have you ever wondered how this works?

    > If you call Meteor.subscribe within a reactive computation, for example using Tracker.autorun, the subscription will automatically be cancelled when the computation is invalidated or stopped.

    When you create a subscription, something like this happens:

    ```js
    Subscription = function() {
      Tracker.currentComputation.onInvalidate(function() {
        this.stop()
      }.bind(this))
    }
    ```
    This is useful for declaratively doing cleanup in Meteor simply by calling a function in a reactive computation. I use this exact pattern to [stop cached subscriptions after some delay in `ccorcos:subs-cache`](https://github.com/ccorcos/meteor-subs-cache/blob/master/src/subsCache.coffee#L84).

    `afterFlush` is very useful for queuing up changes in Meteor and executing them all at once. This is exactly how I [queue up reactive updates](https://github.com/ccorcos/meteor-react-mixin/blob/master/src/utils.coffee#L127) to efficiently [update the state of a React component](https://github.com/ccorcos/meteor-react-mixin/blob/master/src/utils.coffee#L171) in [`ccorcos:react-meteor`](https://github.com/ccorcos/meteor-react-mixin).


# Bonus

If you want to see some more intense stuff using Tracker, check out the [observable streams library](https://github.com/ccorcos/meteor-tracker-streams) I build using `ReactiveVar`s.


