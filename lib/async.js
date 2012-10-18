var toArray = require("to-array")
    , partial = require("ap").partial

module.exports = Async

function Async(base, transformation, serial) {
    return transformator

    function transformator(stream) {
        var rest = toArray(arguments, 1)

        rest.unshift(transformation)
        var func = partial.apply(null, rest)

        return base(stream, func, serial)
    }
}
