var map = require("lazy-map-stream")
    , reductions = require("lazy-reductions-stream")
    , flatten = require("lazy-flatten-stream")
    , filter = require("lazy-filter-stream")
    , partial = require("ap").partial
    , forEach = require("for-each")
    , to = require("write-stream").toArray

    , slice = Array.prototype.slice
    , methods = {
        map: map
        , filter: filter
        , reductions: reductions
        , flatten: flatten
        , log: log
    }

module.exports = chain

function chain(stream) {
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
