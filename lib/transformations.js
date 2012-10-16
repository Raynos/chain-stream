/*global WeakMap: true*/

var forEachObject = require("for-each")
    , toArray = require("to-array")
    , WriteStream = require("write-stream")
    , fromArray = require("read-stream").fromArray
    , WeakMap = require("weakmap")
    , createStorage = WeakMap.createStorage
    , ReadWriteStream = require("read-write-stream")
    , partial = require("ap").partial

    , Async = require("./async")
    , Sync = require("./sync")
    , lazyTransform = require("./transformParallel")
    , lazySerialTransform = require("./transformSerial")
    , LazyPipe = require("./lazyPipe")
    , chain = require("../index")

    , transformations = {
        map: map
        , filter: filter
        , reductions: reduce
        , concatMap: concatMap
        , flatten: flatten
        , remove: remove
        , dropWhile: dropWhile
        , drop: drop
        , takeWhile: takeWhile
        , take: take
    }

    , every = partial(firstMatching, false)
    , some = partial(firstMatching, true)
    , last = LazyPipe(lastStream)
    , first = LazyPipe(firstStream)

    , complexTransformations = {
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
        concat: concat
        , first: first
        , last: last
        , lazyPipe: lazyPipe
    }

module.exports = methods

forEachObject(transformations, function (func, name) {
    var asyncFunc = Async(lazyTransform, func)
        , syncFunc = Sync(asyncFunc)
        , asyncSerialFunc = Async(lazySerialTransform, func)

    methods[name + "AsyncSerial"] = asyncSerialFunc
    methods[name + "Async"] = asyncFunc
    methods[name + "Sync"] = syncFunc
    methods[name] = syncFunc
})

forEachObject(complexTransformations, function (data, name) {
    var transform = data.transform
        , func = data.func

        , asyncFunc = func(methods[transform + "Async"])
        , syncFunc = func(methods[transform + "Sync"])
        , asyncSerialFunc = func(methods[transform + "AsyncSerial"])

    methods[name + "AsyncSerial"] = asyncSerialFunc
    methods[name + "Async"] = asyncFunc
    methods[name + "Sync"] = syncFunc
    methods[name] = syncFunc
})

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

var dropWhileMap = WeakMap()

function dropWhile(iterator, value, write, end) {
    var self = this
        , stopped = dropWhileMap.get(self)

    if (stopped) {
        return end(null, value)
    }

    iterator(value, function (err, bool) {
        if (bool === false) {
            dropWhileMap.set(self, true)
            end(null, value)
        } else {
            end()
        }
    })
}

var countStore = createStorage(function () {
    return {
        count: 0
    }
})

function drop(count, value, write, end) {
    var counter = countStore(this)

    dropWhile.call(this, function (value, callback) {
        return callback(null, ++counter.count < count)
    }, value, write, end)
}

var takeWhileMap = WeakMap()

function takeWhile(iterator, value, write, end) {
    var self = this
        , stopped = takeWhileMap.get(self)

    if (stopped) {
        return end()
    }

    iterator(value, function (err, bool) {
        if (bool === false) {
            takeWhileMap.set(self, true)
            self.end()
            self.write = noop
            self.end = noop
            end()
        } else {
            end(null, value)
        }
    })
}

function take(count, value, write, end) {
    var counter = countStore(this)

    takeWhile.call(this, function (value, callback) {
        return callback(null, ++counter.count <= count)
    }, value, write, end)
}

function noop() {}

var reductionsMap = WeakMap()

function reduce(iterator, initial, value, write, end) {
    var self = this
        , accumulator = reductionsMap.get(self)

    if (accumulator === undefined) {
        reductionsMap.set(self, initial)
        accumulator = initial
    }

    iterator(accumulator, value, function (err, result) {
        if (err) {
            return end(err)
        }

        reductionsMap.set(self, result)

        end(null, result)
    })
}

function concat() {
    var streams = toArray(arguments)
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
    var stream = LazyPipe(returnTarget)(source)

    return chain(stream)

    function returnTarget() {
        return target
    }
}

function firstStream(defaultValue) {
    var queue = ReadWriteStream(write, end)
        , written

    return queue.stream

    function write(chunk, queue) {
        written = true
        queue.end(chunk)
        this.write = function () {}
        this.end = function () {}
    }

    function end() {
        if (!written) {
            queue.end(defaultValue)
        }
    }
}

function lastStream() {
    return ReadWriteStream(write).stream

    function write(chunk, queue) {
        queue.shift()
        queue.push(chunk)
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

        return first(dropWhile(stream, condition), !boolean)

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
        return last(reduce.apply(null, arguments))
    }
}
