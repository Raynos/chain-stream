var WriteStream = require("write-stream")
    , streamToArray = WriteStream.toArray

module.exports = {
    toArray: toArray
    , forEach: forEach
    , value: value
}

function forEach(source, callback) {
    source.pipe(WriteStream(callback))
    return source
}

function toArray(source, callback) {
    source.pipe(streamToArray(callback))
    return source
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
