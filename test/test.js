var test = require("tap").test
    , stackchain = require("stack-chain")
    , fromArray = require("read-stream").fromArray
    , ReadWriteStream = require("read-write-stream")

    , chain = require("..")

    , original = [1, 2, 3]
    , sums = [1, 3, 6]
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

test("mapSync", function (t) {
    s()
        .mapSync(function (value) {
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

test("filterSync", function (t) {
    s()
        .filterSync(function (value) {
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

test("reductionsSync", function (t) {
    s()
        .reductionsSync(function (acc, value) {
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

test("concatMapSync", function (t) {
    s()
        .concatMapSync(function (value) {
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

test("removeSync", function (t) {
    s()
        .removeSync(function (value) {
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

function s() {
    return chain([1, 2, 3])
}
