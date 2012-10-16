# chain-stream

Chain stream operations together

## Example

``` js
var chain = require("chain-stream")
    , fromArray = require("read-stream").fromArray

chain(fromArray([1,2,3,4,5]))
        // double them
        .mapAsync(function mapping(value, callback) {
            setTimeout(function later() {
                callback(null, value * 2)
            }, 20)
        })
        // count them
        .reduce(function reducing(acc, value) {
            return value + acc
        }, 0)
        // map the result into three values
        .concatMap(function (value) {
            return [value - 10, value, value + 10]
        })
        // map them to streams
        .map(function (value) {
            var list = []
            for (var i = 0; i < value; i++) {
                list.push(i)
            }

            return fromArray(list)
        })
        // flatten the streams into one stream
        .flatten()
        // filter for multiples of 5
        .filter(function (v) {
            return v % 5 === 0
        })
        .reduceSerial(function reducing(acc, value, callback) {
            setTimeout(function later() {
                callback(null, acc + value)
            }, Math.random() * 100)
        }, 0)
        .value(function result(value) {
            // 470
            console.log("value", value)
        })

```

## Installation

`npm install chain-stream`

# Contents

Chain stream gives you transformations and consumption functions over
streams. They also give you different types like sync / async vs serial /
parallel.

About half of these are implemented.

## Types

There are different types of iterators. They are useful and can be combined

 - `chain.method` (Sync version)
 - `chain.methodAsync`
 - `chain.methodSerial`

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

This async iterator will run your callbacks in parallel

### Serial

All Serial iterators are also async, sync iterators run in serial by defualt.

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
}, initial)
```

reduce returns a stream containing one value

### every

Returns the first value that fails the predicate or true

```
things.every(somePredicate)
```

### some

Returns the first value that matches the predicate or false

```
things.some(somePredicate)
```

### lazyPipe

Lazyily pipe a stream onto this. It's a way to say

> I want to pipe this stream but not now

```
things
    .lazyPipe(someStream)
    .moreChainingThings()
```

### first

Returns a stream containing the first value

`var s = things.first()`

### Last

Returns a stream containing the last value

`var s = things.last()`
## Consumption functions

A consumption function starts consumign items in the stream

### forEach

call the iterator for each item

`things.forEach(console.log)`

### toArray

turn the stream into an array. This obvouisly buffers the entire
stream into an array

```
things.toArray(function (array){
    ...
})
```

### value

Return the last chunk in the array

```
data.value(function (lastChunk) {
    ...
})
```


## Contributors

 - Raynos

## MIT Licenced
