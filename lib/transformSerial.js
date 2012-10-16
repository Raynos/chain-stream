var LazyPipe = require("./lazyPipe")
    , ReadWriteStream = require("read-write-stream")
    , transform = LazyPipe(TransformSerial)

transform.TransformSerial = TransformSerial

module.exports = transform

function TransformSerial(transformation) {
    var queue = ReadWriteStream(write, end)
        , stream = queue.stream
        , endCount = 0
        , ended = false

    return stream

    function write(chunk, queue) {
        if (ended === true) {
            return false
        }

        endCount++
        transformation.call(stream, chunk, queue.push, finish)

        return false
    }

    function finish(err, result) {
        if (err) {
            return stream.emit("error", err)
        }

        if (result) {
            queue.push(result)
        }

        stream.emit("drain")

        endCount--
        if (ended && endCount === 0) {
            queue.end()
        }
    }

    function end() {
        ended = true
        if (endCount === 0) {
            queue.end()
        }
    }

    function earlyTermination() {

    }
}
