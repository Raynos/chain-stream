var toArray = require("to-array")

module.exports = Sync

function Sync(base) {
    return transformator

    function transformator(stream, iterator) {
        var args = toArray(arguments)
        if (typeof args[1] === "function") {
            args[1] = applyIterator
        }

        return base.apply(null, args)

        function applyIterator() {
            var args = toArray(arguments)
                , last = args.pop()

            var result = iterator.apply(null, args)

            last(null, result)
        }
    }
}
