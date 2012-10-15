var forEachObject = require("for-each")
    , WriteStream = require("write-stream")
    , streamToArray = WriteStream.toArray
    , argumentsToArray = require("to-array")

    , Async = require("./async")
    , Sync = require("./sync")
    , transformations = require("./transformations")

    , consumers = {
        reduce: {
            func: reducer
            , transform: "reductions"
        }
    }
    , methods = {
        toArray: toArray
        , log: log
        , forEach: forEach
        , consume: consume
        , last: last
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

function reducer(reduce) {
    return function () {
        var args = argumentsToArray(arguments)
            , callback = args.pop()

        last(reduce.apply(null, args), callback)
    }
}
