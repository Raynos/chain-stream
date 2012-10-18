var test = require("tap").test
    , stackchain = require("stack-chain")
    , fromArray = require("read-stream").fromArray
    , ReadWriteStream = require("read-write-stream")
    , ReadStream = require("read-stream")
    , trycatch = require("trycatch")

    , chain = require("..")

    , original = [1, 2, 3]
    , sums = [1, 3, 6]
    , twoPlus = [2, 3]
    , firstTwo = [1, 2]
    , odds = [1, 3]
    , evens = [2]
    , doubles = [2, 4, 6]
    , twice = [1, 2, 2, 4, 3, 6]
    , six = [1,2,3,4,5,6]

stackchain.filter.attach(function (error, frames) {
    return frames.filter(function (callSite) {
        var file = callSite.getFileName()
        return file[0] === '/' &&
            file.indexOf("node_modules") === -1
    })
})

test("chain is a function", function (t) {
    t.equal(typeof chain, "function")
    t.end()
})

test("chain returns readable stream", function (t) {
    var stream = s()

    t.ok(stream.pipe)
    t.end()
})

test("transform", function (t) {
    s()
        .transform(function (value, write, end) {
            end(null, value * 2)
        })
        .toArray(function (list) {
            t.deepEqual(list, doubles)
            t.end()
        })
})

test("mapAsync", function (t) {
    s()
        .mapAsync(function (value, callback) {
            callback(null, value * 2)
        })
        .toArray(function (list) {
            t.deepEqual(list, doubles)
            t.end()
        })
})

test("map", function (t) {
    s()
        .map(function (value) {
            return value * 2
        })
        .toArray(function (list) {
            t.deepEqual(list, doubles)
            t.end()
        })
})

test("filterAsync", function (t) {
    s()
        .filterAsync(function (value, callback) {
            callback(null, value % 2)
        })
        .toArray(function (list) {
            t.deepEqual(list, odds)
            t.end()
        })
})

test("filter", function (t) {
    s()
        .filter(function (value) {
            return value % 2
        })
        .toArray(function (list) {
            t.deepEqual(list, odds)
            t.end()
        })
})

test("reductionsAsync", function (t) {
    s()
        .reductionsAsync(function (acc, value, callback) {
            callback(null, acc + value)
        }, 0)
        .toArray(function (list) {
            t.deepEqual(list, sums)
            t.end()
        })
})

test("reductions", function (t) {
    s()
        .reductions(function (acc, value) {
            return acc + value
        }, 0)
        .toArray(function (list) {
            t.deepEqual(list, sums)
            t.end()
        })
})

test("concatMapAsync", function (t) {
    s()
        .concatMapAsync(function (value, callback) {
            callback(null, [value, value * 2])
        })
        .toArray(function (list) {
            t.deepEqual(list, twice)
            t.end()
        })
})

test("concatMap", function (t) {
    s()
        .concatMap(function (value) {
            return [value, value * 2]
        })
        .toArray(function (list) {
            t.deepEqual(list, twice)
            t.end()
        })
})

test("concatMap with streams", function (t) {
    s()
        .concatMap(function (value) {
            return fromArray([value, value * 2])
        })
        .toArray(function (list) {
            t.deepEqual(list, twice)
            t.end()
        })
})

test("flatten", function (t) {
    s()
        .map(function (value) {
            return fromArray([value, value * 2])
        })
        .flattenAsync()
        .toArray(function (list) {
            t.deepEqual(list, twice)
            t.end()
        })
})

test("flatten arrays", function (t) {
    s()
        .map(function (value) {
            return [value, value * 2]
        })
        .flatten()
        .toArray(function (list) {
            t.deepEqual(list, twice)
            t.end()
        })
})

test("removeAsync", function (t) {
    s()
        .removeAsync(function (value, callback) {
            callback(null, value % 2)
        })
        .toArray(function (list) {
            t.deepEqual(list, evens)
            t.end()
        })
})

test("remove", function (t) {
    s()
        .remove(function (value) {
            return value % 2
        })
        .toArray(function (list) {
            t.deepEqual(list, evens)
            t.end()
        })
})

test("concat", function (t) {
    s()
        .concat([4, 5, 6])
        .toArray(function (list) {
            t.deepEqual(list, six)
            t.end()
        })
})

test("concat with streams", function (t) {
    s()
        .concat(fromArray([4, 5, 6]))
        .toArray(function (list) {
            t.deepEqual(list, six)
            t.end()
        })
})

test("lazyPipe", function (t) {
    s()
        .lazyPipe(ReadWriteStream(function (value, queue) {
            queue.push(value * 2)
        }).stream)
        .toArray(function (list) {
            t.deepEqual(list, doubles)
            t.end()
        })
})

test("dropWhileAsync", function (t) {
    s()
        .dropWhileAsync(function (value, callback) {
            callback(null, value < 2)
        })
        .toArray(function (list) {
            t.deepEqual(list, twoPlus)
            t.end()
        })
})

test("dropWhile", function (t) {
    s()
        .dropWhile(function (value) {
            return value < 2
        })
        .toArray(function (list) {
            t.deepEqual(list, twoPlus)
            t.end()
        })
})

test("drop", function (t) {
    s()
        .drop(2)
        .toArray(function (list) {
            t.deepEqual(list, twoPlus)
            t.end()
        })
})

test("dropAsync", function (t) {
    s()
        .dropAsync(2)
        .toArray(function (list) {
            t.deepEqual(list, twoPlus)
            t.end()
        })
})

test("takeWhileAsync", function (t) {
    s()
        .takeWhileAsync(function (value, callback) {
            callback(null, value < 3)
        })
        .toArray(function (list) {
            t.deepEqual(list, firstTwo)
            t.end()
        })
})

test("takeWhile", function (t) {
    s()
        .takeWhile(function (value) {
            return value < 3
        })
        .toArray(function (list) {
            t.deepEqual(list, firstTwo)
            t.end()
        })
})

test("takeAsync", function (t) {
    s()
        .takeAsync(2)
        .toArray(function (list) {
            t.deepEqual(list, firstTwo)
            t.end()
        })
})

test("take", function (t) {
    s()
        .take(2)
        .toArray(function (list) {
            t.deepEqual(list, firstTwo)
            t.end()
        })
})

test("take from nonending", function (t) {
    nonending()
        .take(2)
        .toArray(function (list) {
            t.deepEqual(list, firstTwo)
            t.end()
        })
})

test("forEach", function (t) {
    var count = 0

    s()
        .forEach(function (value) {
            count += value
        })
        .once("end", function () {
            t.equal(count, 6)
            t.end()
        })
})

test("last", function (t) {
    slow()
        .reductions(function (acc, value) {
            return acc + value
        }, 0)
        .last()
        .value(function (value) {
            t.equal(value, 15)
            t.end()
        })
})

test("reduce", function (t) {
    s()
        .reduce(function (acc, value) {
            return acc + value
        }, 0)
        .value(function (value) {
            t.equal(value, 6)
            t.end()
        })
})

test("reduceAsync", function (t) {
    s()
        .reduceAsync(function (acc, value, callback) {
            callback(null, acc + value)
        }, 0)
        .value(function (value) {
            t.equal(value, 6)
            t.end()
        })
})

test("async map reduce", function (t) {
    slow()
        // double them
        .mapAsync(function mapping(value, callback) {
            setTimeout(function later() {
                callback(null, value * 2)
            }, 20)
        })
        .reduce(function reducing(acc, value) {
            return value + acc
        }, 0)
        .value(function result(value) {
            t.equal(value, 30)
            t.end()
        })
})

test("first nonending", function (t) {
    nonending()
        .first()
        .value(function (value) {
            t.equal(value, 1)
            t.end()
        })
})

test("some", function (t) {
    s()
        .some(function (value) {
            return value === 2
        })
        .value(function (result) {
            t.equal(result, 2)
            t.end()
        })
})

test("someAsync", function (t) {
    s()
        .someAsync(function (value, callback) {
            setTimeout(function () {
                callback(null, value === 2)
            }, 50)
        })
        .value(function (result) {
            t.equal(result, 2)
            t.end()
        })
})

test("some returns false for no match", function (t) {
    s()
        .some(function (value) {
            return value === 4
        })
        .value(function (result) {
            t.equal(result, false)
            t.end()
        })
})

test("every", function (t) {
    s()
        .every(function (value) {
            return value !== 2
        })
        .value(function (result) {
            t.equal(result, 2)
            t.end()
        })
})

test("everyAsync", function (t) {
    s()
        .everyAsync(function (value, callback) {
            setTimeout(function () {
                callback(null, value !== 2)
            }, 50)
        })
        .value(function (result) {
            t.equal(result, 2)
            t.end()
        })
})

test("every returns true for no match", function (t) {
    s()
        .every(function (v) {
            return typeof v === "number"
        })
        .value(function (result) {
            t.equal(result, true)
            t.end()
        })
})

test("reduceSerial", function (t) {
    var times = [30, 25, 20, 15, 10]

    slow()
        .reduceSerial(function (acc, v, callback) {
            setTimeout(function () {
                callback(null, acc + v)
            }, times.shift())
        }, 0)
        .value(function (sum) {
            t.equal(sum, 15)
            t.end()
        })
})

function s() {
    return chain([1, 2, 3])
}

function slow() {
    var queue = ReadStream()

    later(10, 1)
    later(20, 2)
    later(30, 3)
    later(40, 4)
    later(50, 5)
    later(60, null)

    return chain(queue.stream)

    function later(time, value) {
        setTimeout(function () {
            queue.push(value)
        }, time)
    }
}

function nonending() {
    var queue = ReadStream()

    ;[1,2,3,4,5].forEach(queue.push)

    return chain(queue.stream)
}

function addTogether(one, two) {
    return {
        count: one.count + two.count
    }
}
