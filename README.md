# chain-stream

Chain stream operations together

## Example

The result of chain is a stream at every step. In addition to being a stream it has the methods demonstrated below

```
var chain = require("chain-stream")
    , from = require("read-stream").fromArray

// Creates a stream from an array
// You can also pass any readable stream in
chain([1,2,3,4,5])
    // [1, 2, 3, 4, 5]
    .log("initial state")
    // Map every chunk of data flowing through the stream to something else
    .map(function (x) { return x * 5 })
    // [5, 10, 15, 20, 25]
    .log("mapped state")
    // Filter the stream by dropping chunks you don't care about
    .filter(function (x) { return x % 2 })
    // [5, 15, 25]
    .log("filtered state")
    // Concatenate takes other streams and concatenates them into the
    // current stream
    .concat(from([8]))
    // [5, 15, 25, 8]
    .log("concatenated state")
    // Accumulate state about the stream
    .reductions(function (acc, x) { return acc + x }, 0)
    // [5, 20, 45, 53]
    .log("reducted state")
    // Map the each chunk to a stream. This becomes a stream of streams
    .map(function (x) { return from([x, x * 2, x * 3]) })
    // forEach stream run the iterator
    .forEach(function iterator (stream) {
        console.log("has read", !!stream.read)
    })
    // Flatten the stream of streams into a single stream
    .flatten()
    .value(function (state) {
        // [5, 10, 15, 20, 40, 60, 45, 90, 135, 54, 106, 159]
        console.log("final state", state)
    })
```

`log` and `value` are just utility methods that make the debugging easier.

## Installation

`npm install chain-stream`

# Contents

Chain stream gives you transformations and consumption functions over
streams. They also give you different types like sync / async vs serial /
parallel.

About half of these are implemented.

## Types

There are different types of iterators. They are useful and can be combined

`chain.method[Sync or Async][Parallel or Serial]`

It should be noted that `chain.method` defaults to sync and parallel.

Similarly `chain.methodAsync` and `chain.methodSync` default to parallel.

Also `chain.methodParallel` and `chain.methodSerial` default to sync.

### Sync

The iterator is synchronous. i.e. it is finished after the function returns

``` js
// sync map
thing.map(function iterator(value) {
    return value * 2
})
```

All transformation and consumption functions are sync by default.

### Async

The iterator is asynchronous.
i.e. it is finished some time later when the callback function is called

``` js
thing.asyncMap(function iterator(value, end) {
    setTimeout(function later() {
        callback(null, value * 2)
    }, 500)
})
```

### Streaming

The iterator is synchronous but returns a stream. A stream by it's nature
is asynchronous. A stream represents a lazy potentially infinite list and
will be merged in based on what makes sense from the iterator

``` js
thing.mapStream(function iterator(value) {
    return fromArray([1,2,3])
})
```

### Parallel

A parallel iterator is one where multiple iterators are allowed to run
in parallel.

Because javascript is single threaded synchronous iterators can not be
parallel.

All transformations are parallel by default

``` js
thing.reduceAsyncParallel(function iterator(acc, value, callback) {
    // These happen in parallel and return in arbitary order.

    readFile(value, function (err, data) {
        if (!err) {
            callback(null, { count: 1 })
        } else {
            callback(null, { count: 0 })
        }
    })

}, function combine(one, two) {
    // A synchronous combination function taking two reduced values
    // and returns a reduced value synchronously
    return { count: one.count + two.count }
}, function (err, value) {
    // the fully reduced value
})
```

### Serial

A serial iterator is one where the next value cannot be iterated over before
the current iterator finishes

``` js
thing.mapAsyncSerial(function iterator(value, callback) {
    setTimeout(function () {
        callback(null, value * 2)
    }, 500)
})
```

Note that if there were 10 items in thing this would take 5s where as the
parallel version takes 500ms.

However serial is useful if you want to preserve the order like doing
asynchronous mapping over a file and you want to preserve the original
order of lines.

## Transformation functions

Transformations take a stream and return a stream with the transformation
queued up.

All transformations will be applied lazily only once the stream is consumed

### Map

map takes an iterator and replaces every value by the result of the
iterator.

``` js
var doubles = thing.map(function (v) { return v * 2})
```

### Filter

filter takes an iterator and keeps the value if the iterator returns true

``` js
var odds = things.filter(function (v) { return v % 2 })
```

### Remove

remove takes an iterator and drops the value if the iterator returns true

``` js
var evens = things.remove(function (v) { return v % 2 })
```

### Reductions

reductions takes an iterator and an accumalator. It replaces the value
and accumulator with the returned value

``` js
var sums = things.reductions(function (sum, v) { return sum + v }, 0)
```

Reductions may need a combining function if it's asynchronous so that it
knows how to combine the accumulators.

``` js
var sums = things.reductionsAsync(function (sum , v, cb) {
    setTimeout(function () {
        cb(null, sum + v)
    }, 500)
}, function (acc, value) {
    return acc + value
})
```

### Take

take returns a stream containing only the first n elements

```
var firstTen = things.take(10)
```

### drop

drop returns a streaming that doesn't contain the first n elements

```
var restButTen = things.drop(10)
```

### Take While

take while returns a stream containing the first n elements while the
iterator returns true

```
var sensible = things.takeWhile(isSensible)
```

take while is serial by default. Parallel doesn't make much sense

### Drop while

drop while returns a stream with the first n elements dropped while the
iterator returns true

```
var withoutFirstSensible = things.dropWhile(isSesnsible)
```

drop while is serial by default. Parallel doesn't make much sense

### Flatten

flatten flattens out all the items if the items are an array or a stream

``` js
var items = lists.flatten()
```

### Concat Map

concat map is a mapping followed by a flatten

``` js
var values = things.concatMap(function (value) {
    return [value * 2, value * 3]
})
// values = things.map(iterator).flatten()
```

### Concat

concat takes multiple things and turns them into a single list and
then flattens that.

``` js
var numbers = concat(evens, odds)
// list([events, odds]).flatten()
```

## Consumption functions

A consumption function starts consumign items in the stream

### forEach

call the iterator for each item

`things.forEach(console.log)`

### reduce

call the iterator with the current accumulator and the value for
each item.

```
things.reduce(function (acc, v) {
    /* ... */
}, initial)
```

This will need a combination function as well if it's asynchronous.

```
things.reduce(function reduction(acc, v, cb) {
    /* do asynchronous reduction */
}, function combine(acc, value) {
    /* do synchronous combination */
}, function done(err, value) {
    /* final reduced value */
})
```

## Contributors

 - Raynos

## MIT Licenced
