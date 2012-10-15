/*global WeakMap: true*/

var forEachObject = require("for-each")
    , toArray = require("to-array")
    , WriteStream = require("write-stream")
    , fromArray = require("read-stream").fromArray
    , WeakMap = require("weakmap")
    , createStorage = WeakMap.createStorage
    , ReadWriteStream = require("read-write-stream")

    , Async = require("./async")
    , Sync = require("./sync")
    , lazyTransform = require("./transformParallel")
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
    , methods = {
        concat: concat
        , lazyPipe: lazyPipe
    }

module.exports = methods

forEachObject(transformations, function (func, methodName) {
    var asyncName = methodName + "Async"
        , syncName = methodName + "Sync"
        , asyncFunc = Async(lazyTransform, func)
        , syncFunc = Sync(asyncFunc)

    methods[asyncName] = asyncFunc
    methods[syncName] = syncFunc
    methods[methodName] = syncFunc
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
            self.write = noop
            self.end()
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
