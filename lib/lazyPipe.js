var EventEmitter = require("events").EventEmitter
    , toArray = require("to-array")

module.exports = LazyPipe

function LazyPipe(Transformer) {
    return function (source) {
        var pipeStream
            , stream = new EventEmitter()
            , args = toArray(arguments, 1)

        stream.pipe = pipe
        stream.unpipe = unpipe

        source.on("error", reemit)

        return stream

        function pipe(target) {
            if (!pipeStream) {
                pipeStream = Transformer.apply(null, args)
                pipeStream.on("error", reemit)
                source.pipe(pipeStream)
            }

            return pipeStream.pipe(target)
        }

        function unpipe(target) {
            pipeStream.unpipe(target)
        }

        function reemit(err) {
            stream.emit("error", err)
        }
    }
}
