var map = require("lazy-map-stream")
    , reductions = require("lazy-reductions-stream")
    , flatten = require("lazy-flatten-stream")
    , filter = require("lazy-filter-stream")
    , concat = require("lazy-concat-stream")
    , partial = require("ap").partial
    , forEach = require("for-each")
    , forEachStream = require("for-each-stream")
    , to = require("write-stream").toArray
    , from = require("read-stream").fromArray

    , slice = Array.prototype.slice
    , methods = {
        map: map
        , filter: filter
        , reductions: reductions
        , flatten: flatten
        , log: log
        , forEach: forEachStream
        , concat: concat
        , value: value
    }

module.exports = chain

function chain(stream) {
    if (Array.isArray(stream)) {
        stream = from(stream)
    }

    forEach(methods, applyMethod, stream)

    return stream
}

function applyMethod(func, methodName) {
    var stream = this
    stream[methodName] = intercept

    function intercept() {
        var args = slice.call(arguments)
        args.unshift(stream)
        return chain(func.apply(null, args))
    }
}

function log(stream, message) {
    stream.pipe(to(logState))
    return stream

    function logState(state) {
        console.log(message || "[CHAIN.LOG]", state)
    }
}

function value(stream, callback) {
    stream.pipe(to(callback))
    return stream
}
