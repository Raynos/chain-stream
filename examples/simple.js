var chain = require("..")
    , from = require("read-stream").fromArray

chain([1,2,3,4,5])
    .log("initial state")
    .map(function (x) { return x * 5 })
    .log("mapped state")
    .filter(function (x) { return x % 2 })
    .log("filtered state")
    .concat(from([8]))
    .log("concatenated state")
    .reductions(function (acc, x) { return acc + x }, 0)
    .log("reducted state")
    .map(function (x) { return from([x, x * 2, x * 3]) })
    // These are streams
    .forEach(function (stream) {
        console.log("has read", !!stream.read)
    })
    .flatten()
    .toArray(function (state) {
        console.log("final state", state)
    })
