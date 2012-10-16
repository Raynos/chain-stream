var EventEmitter = require("events").EventEmitter
    , toArray = require("to-array")

module.exports = LazyPipe

function LazyPipe(Transformer) {
    return function (source) {
        var pipeStream
            , stream = new EventEmitter()
            , args = toArray(arguments, 1)
            , pipes = 0

        stream.pipe = pipe
        stream.unpipe = unpipe

        source.on("error", reemit)

        return stream

        function pipe(target) {
            if (!pipeStream) {
                pipeStream = Transformer.apply(null, args)
                pipeStream.on("error", reemit)
            }

            if (pipes === 0) {
                source.pipe(pipeStream)
            }

            pipes++

            return pipeStream.pipe(target)
        }

        function unpipe(target) {
            target.on("unpipe", cleanup)

            pipeStream.unpipe(target)

            target.removeListener("unpipe", cleanup)

            function cleanup() {
                pipes--
                if (pipes === 0) {
                    source.unpipe(pipeStream)
                }
            }
        }

        function reemit(err) {
            stream.emit("error", err)
        }
    }
}
