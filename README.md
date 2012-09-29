# chain-stream

Chain stream operations together

## Example

The result of chain is a stream at every step. In addition to being a stream it has the methods demonstrated below

```
var chain = require("..")
    , from = require("read-stream").fromArray

chain([1,2,3,4,5])
    // [1, 2, 3, 4, 5]
    .log("initial state")
    .map(function (x) { return x * 5 })
    // [5, 10, 15, 20, 25]
    .log("mapped state")
    .filter(function (x) { return x % 2 })
    // [5, 15, 25]
    .log("filtered state")
    .reductions(function (acc, x) { return acc + x }, 0)
    // [5, 20, 45]
    .log("reducted state")
    .map(function (x) { return from([x, x * 2, x * 3]) })
    // These are streams
    .flatten()
    .value(function (state) {
        // [5, 10, 15, 20, 40, 60, 45, 90, 135]
        console.log("final state", state)
    })
```

`log` and `value` are just utility methods that make the debugging easier.

## Installation

`npm install chain-stream`

## Contributors

 - Raynos

## MIT Licenced
