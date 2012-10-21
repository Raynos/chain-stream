module.exports = chain

var forEach = require("for-each")
    , fromArray = require("read-stream").fromArray
    , toArray = require("to-array")
    , extend = require("xtend")

    , transformations = require("./lib/transformations")
    , consumers = require("./lib/consumers")

extend(chain, transformations, consumers)

/*

chain

*/

function chain(stream) {
    if (Array.isArray(stream)) {
        stream = fromArray(stream)
    }

    forEach(chain, addMethod, stream)

    return stream
}

function addMethod(method, methodName) {
    var stream = this

    stream[methodName] = call

    function call() {
        var args = toArray(arguments)
        args.unshift(stream)
        return chain(method.apply(null, args))
    }
}
