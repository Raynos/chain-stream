var LazyPipe = require("./lazyPipe")
    , ReadWriteStream = require("read-write-stream")
    , transform = LazyPipe(TransformParallel)

transform.TransformParallel = TransformParallel

module.exports = transform

function TransformParallel(transformation) {
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
        return transformation.call(stream, chunk
            , queue.push, finish)
    }

    function finish(err, result) {
        if (err) {
            return stream.emit("error", err)
        }

        if (result) {
            queue.push(result)
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

    function earlyTermination() {

    }
}
