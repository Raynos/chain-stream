var LazyPipe = require("./lazyPipe")
    , ReadWriteStream = require("read-write-stream")
    , transform = LazyPipe(Transform)

transform.Transform = Transform

module.exports = transform

function Transform(transformation, serial) {
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
        var result = transformation.call(stream, chunk, queue.push, finish)

        return serial ? false : result
    }

    function finish(err, result) {
        if (err) {
            return stream.emit("error", err)
        }

        if (arguments.length === 2) {
            queue.push(result)
        }

        if (serial) {
            stream.emit("drain")
        }

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
}
