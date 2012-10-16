var chain = require("..")
    , fromArray = require("read-stream").fromArray

chain(fromArray([1,2,3,4,5]))
        // double them
        .mapAsync(function mapping(value, callback) {
            setTimeout(function later() {
                callback(null, value * 2)
            }, 20)
        })
        // count them
        .reduce(function reducing(acc, value) {
            return value + acc
        }, 0)
        // map the result into three values
        .concatMap(function (value) {
            return [value - 10, value, value + 10]
        })
        // map them to streams
        .map(function (value) {
            var list = []
            for (var i = 0; i < value; i++) {
                list.push(i)
            }

            return fromArray(list)
        })
        // flatten the streams into one stream
        .flatten()
        // filter for multiples of 5
        .filter(function (v) {
            return v % 5 === 0
        })
        .reduceSerial(function reducing(acc, value, callback) {
            setTimeout(function later() {
                callback(null, acc + value)
            }, Math.random() * 100)
        }, 0)
        .value(function result(value) {
            console.log("value", value)
        })
