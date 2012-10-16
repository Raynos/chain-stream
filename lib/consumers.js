var WriteStream = require("write-stream")
    , streamToArray = WriteStream.toArray

module.exports = {
    toArray: toArray
    , forEach: forEach
    , value: value
}

function forEach(source, callback) {
    return source.pipe(WriteStream(callback))
}

function toArray(source, callback) {
    return source.pipe(streamToArray(callback))
}

function value(source, callback) {
    var lastValue
        , dest = WriteStream(findLast)

    source
        .pipe(dest)
        .once("finish", function () {
            callback(lastValue)
        })

    function findLast(value) {
        lastValue = value
    }
}
