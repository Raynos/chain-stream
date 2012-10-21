var chain = require("..")
    , fromArray = require("read-stream").fromArray

var stream = chain([1,2,3,4,5])
    .toArray(log("initial state"))
    .map(function (x) { return x * 5 })
    .toArray(log("mapped state"))
    .filter(function (x) { return x % 2 })
    .toArray(log("filtered state"))
    .concat(fromArray([8]))
    .toArray(log("concatenated state"))
    .reductions(function (acc, x) { return acc + x }, 0)
    .toArray(log("reducted state"))
    .map(function (x) { return fromArray([x, x * 2, x * 3]) })
    // These are streams
    // .forEach(function (stream) {
    //     console.log("has read", !!stream.read)
    // })
    .flatten()

console.log("consuming stream")

stream.toArray(function (state) {
    console.log("final state", state)
})

chain.toArray(chain.map(fromArray([1,2,3]), function (x) {
    return x * 2
}), function (state) {
    console.log("functions", state)
})

function log(str) {
    return function (list) {
        console.log(str, list)
    }
}
