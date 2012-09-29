var chain = require("..")
    , from = require("read-stream").fromArray
    , to = require("write-stream").toArray

chain(from([1,2,3,4,5]))
    .log("initial state")
    .map(function (x) { return x * 5 })
    .log("mapped state")
    .filter(function (x) { return x % 2 })
    .log("filtered state")
    .reductions(function (acc, x) { return acc + x }, 0)
    .log("reducted state")
    .map(function (x) { return from([x, x * 2, x * 3])})
    // These are streams
    .flatten()
    .log("final state")