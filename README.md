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

## Contributors

 - Raynos

## MIT Licenced
