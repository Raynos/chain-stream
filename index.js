/*global WeakMap: true*/

module.exports = chain

var forEachObject = require("for-each")
    , fromArray = require("read-stream").fromArray
    , ReadWriteStream = require("read-write-stream")
    , argumentsToArray = require("to-array")

    , lazyTransform = require("./lib/transformParallel")
    , LazyPipe = require("./lib/lazyPipe")
    , extend = require("xtend")

    , transformations = require("./lib/transformations")
    , consumers = require("./lib/consumers")
    , methods = extend({}, transformations, consumers)

methods.transform = lazyTransform

/*

chain

*/

function chain(stream) {
    if (Array.isArray(stream)) {
        stream = fromArray(stream)
    }

    forEachObject(methods, addMethod, stream)

    return stream
}

function addMethod(method, methodName) {
    var stream = this

    stream[methodName] = call

    function call() {
        var args = argumentsToArray(arguments)
        args.unshift(stream)
        return chain(method.apply(null, args))
    }
}
