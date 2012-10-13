var ReadWriteStream = require("read-write-stream")
    , forEach = require("for-each")
    , fromArray = require("read-stream").fromArray
    , WriteStream = require("write-stream")
    , streamToArray = WriteStream.toArray
    , argumentsToArray = require("to-array")
    , partial = require("ap").partial

    , methods = {
        map: map
        , filter: filter
        , reductions: reductions
        , concatMap: concatMap
        , flatten: flatten
        , remove: remove
    }

forEach(methods, function (func, methodName) {
    var asyncName = methodName + "Async"
        , syncName = methodName + "Sync"
        , asyncFunc = Async(transform, func)
        , syncFunc = Sync(asyncFunc)

    methods[asyncName] = asyncFunc
    methods[syncName] = syncFunc
    methods[methodName] = syncFunc
})

methods.transform = transform
methods.toArray = toArray
methods.concat = concat
methods.lazyPipe = lazyPipe
methods.log = log

module.exports = chain

function map(iterator, value, write, end) {
    iterator(value, end)
}

function filter(predicate, value, write, end) {
    predicate(value, function (err, bool) {
        if (err) {
            return end(err)
        }

        if (bool) {
            return end(null, value)
        }

        end()
    })
}

function remove(predicate, value, write, end) {
    predicate(value, function (err, bool) {
        if (err) {
            return end(err)
        }

        if (!bool) {
            return end(null, value)
        }

        end()
    })
}

function reductions(iterator, initial, value, write, end) {
    var self = this
    if (!("accumulator" in self)) {
        self.accumulator = initial
    }

    iterator(this.accumulator, value, function (err, result) {
        if (err) {
            return end(err)
        }

        self.accumulator = result
        end(null, result)
    })
}

function concatMap(iterator, value, write, end) {
    iterator(value, function (err, values) {
        if (err) {
            return end(err)
        }

        flatten(values, write, end)
    })
}

function flatten(values, write, end) {
    if (Array.isArray(values)) {
        values.forEach(write)

        return end()
    }

    values.pipe(WriteStream(write, end))
}

function concat() {
    var streams = argumentsToArray(arguments)
        .map(function (stream) {
            if (Array.isArray(stream)) {
                stream = fromArray(stream)
            }

            var buffer = ReadWriteStream().stream

            stream.pipe(buffer)
            return buffer
        })

    var stream = fromArray(streams)

    return methods.flattenAsync(stream)
}

function lazyPipe(source, target) {
    source.pipe(target)
    return chain(target)
}

/*

chain

*/

function chain(stream) {
    if (Array.isArray(stream)) {
        stream = fromArray(stream)
    }

    forEach(methods, addMethod, stream)

    return stream
}

function addMethod(method, methodName) {
    var stream = this

    stream[methodName] = call

    function call() {
        var args = argumentsToArray(arguments)
        args.unshift(stream)
        return chain(method.apply(null, args))
    }
}

/*

utility

*/

function toArray(stream, callback) {
    stream.pipe(streamToArray(callback))
    return stream
}

function log(source, str) {
    source.pipe(streamToArray(function (value) {
        console.log(str, value)
    }))
    return source
}

/*

base functions

*/

function Sync(base) {
    return transformator

    function transformator(stream, iterator) {
        var args = argumentsToArray(arguments)
        if (args.length > 1) {
            args[1] = applyIterator
        }

        return base.apply(null, args)

        function applyIterator() {
            var args = argumentsToArray(arguments)
                , last = args.pop()

            var result = iterator.apply(null, args)

            last(null, result)
        }
    }
}

function Async(base, transformation) {
    return transformator

    function transformator(stream) {
        var rest = argumentsToArray(arguments, 1)

        rest.unshift(transformation)
        var func = partial.apply(null, rest)

        return base(stream, func)
    }
}

function transform(source, transformation) {
    var pipeQueue
        , pipeStream
        , stream = ReadWriteStream().stream

    stream.pipe = pipe

    return stream

    function pipe(target) {
        var endCount = 0
            , ended = false

        if (!pipeQueue) {
            pipeQueue = ReadWriteStream(write, end)
            pipeStream = pipeQueue.stream
            source.pipe(pipeStream)
        }

        return pipeStream.pipe(target)

        function write(chunk, queue) {
            endCount++
            return transformation.call(stream, chunk
                , queue.push, finish)
        }

        function finish(err, result) {
            if (err) {
                return stream.emit("error", err)
            }

            if (result) {
                pipeQueue.push(result)
            }

            endCount--
            if (ended && endCount === 0) {
                // pipeQueue.end()
                pipeStream.emit("end")
            }
        }

        function end() {
            ended = true
            if (endCount === 0) {
                // pipeQueue.end()
                pipeStream.emit("end")
            }
        }
    }
}
