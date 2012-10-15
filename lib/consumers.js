var forEachObject = require("for-each")
    , WriteStream = require("write-stream")
    , streamToArray = WriteStream.toArray
    , argumentsToArray = require("to-array")
    , not = require("not")
    , partial = require("ap").partial

    , Async = require("./async")
    , Sync = require("./sync")
    , transformations = require("./transformations")

    , every = partial(firstMatching, false)
    , some = partial(firstMatching, true)
    , consumers = {
        reduce: {
            func: reducer
            , transform: "reductions"
        }
        , every: {
            func: every
            , transform: "dropWhile"
        }
        , some: {
            func: some
            , transform: "dropWhile"
        }
    }
    , methods = {
        toArray: toArray
        , log: log
        , forEach: forEach
        , consume: consume
        , last: last
        , first: first
    }

forEachObject(consumers, function (data, name) {
    var transform = data.transform
        , func = data.func

        , asyncFunc = func(transformations[transform + "Async"])
        , syncFunc = func(transformations[transform + "Sync"])

    methods[name + "Async"] = asyncFunc
    methods[name + "Sync"] = syncFunc
    methods[name] = syncFunc
})

module.exports = methods

function consume(source) {
    return source.pipe(WriteStream())
}

function forEach(source, callback) {
    return source.pipe(WriteStream(callback))
}

function toArray(source, callback) {
    return source.pipe(streamToArray(callback))
}

function log(source, str) {
    source.pipe(streamToArray(function (value) {
        console.log(str, value)
    }))
    return source
}

function last(source, callback) {
    var lastValue

    source.pipe(WriteStream(keepLast))
        .once("finish", function () {
            callback(lastValue)
        })

    function keepLast(value) {
        lastValue = value
    }
}

function first(source, callback) {
    var firstValue
        , dest = WriteStream(findFirst)

    source.pipe(dest)
        .once("finish", function () {
            callback(firstValue)
        })

    function findFirst(value) {
        firstValue = value
        source.unpipe(dest)
        dest.end()
    }
}

/*
    every : boolean === false
    some : boolean === true
*/
function firstMatching(boolean, dropWhile) {
    return function (stream, iterator, callback) {
        var condition
        if (boolean) {
            condition = negate
        } else {
            condition = iterator
        }

        first(dropWhile(stream, condition), results)

        function results(value) {
            callback(value === undefined ? !boolean : value)
        }

        function negate(value, callback) {
            if (!callback) {
                return !iterator(value)
            }

            iterator(value, function (err, result) {
                if (err) {
                    return callback(err)
                }

                callback(null, !result)
            })
        }
    }
}

function reducer(reduce) {
    return function () {
        var args = argumentsToArray(arguments)
            , callback = args.pop()

        last(reduce.apply(null, args), callback)
    }
}
