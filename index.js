module.exports = chain

var forEachObject = require("for-each")
    , fromArray = require("read-stream").fromArray
    , toArray = require("to-array")
    , extend = require("xtend")

    , transformations = require("./lib/transformations")
    , consumers = require("./lib/consumers")
    , methods = extend({}, transformations, consumers)

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
        var args = toArray(arguments)
        args.unshift(stream)
        return chain(method.apply(null, args))
    }
}
