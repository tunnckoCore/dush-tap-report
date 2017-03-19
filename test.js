/*!
 * dush-tap-reporter <https://github.com/tunnckoCore/dush-tap-reporter>
 *
 * Copyright (c) Charlike Mike Reagent <@tunnckoCore> (https://i.am.charlike.online)
 * Released under the MIT license.
 */

/* jshint asi:true */

'use strict'

var test = require('mukla')
var dush = require('dush')
var extend = require('extend-shallow')
var reporter = require('./index')

var failing = {
  title: 'some failing test',
  index: 23,
  reason: new Error('abc quxie')
}

function fixture (opts) {
  var app = dush()
  app.output = ''

  return app
    .use(reporter(extend({
      writeLine: function () {
        var args = [].slice.call(arguments)
        app.output += args.join(' ') + '\n'
      }
    }, opts)))
}

test('should handle start event', function (done) {
  var app = fixture()
  app.emit('start')
  test.strictEqual(app.output.trim(), 'TAP version 13')
  done()
})

test('should handle passing test', function (done) {
  var app = fixture()
  app.emit('pass', app, {
    title: 'foo bar',
    index: 2
  })

  test.strictEqual(/# :\) foo bar/.test(app.output), true)
  test.strictEqual(/ok 2 - foo bar/.test(app.output), true)
  done()
})

test('should handle main errors', function (done) {
  var app = fixture()
  app.emit('fail', app, failing)

  test.strictEqual(/# :\( some failing test/.test(app.output), true)
  test.strictEqual(/name: Error/.test(app.output), true)
  test.strictEqual(/message: abc quxie/.test(app.output), true)
  test.strictEqual(/ {2}at: Object/.test(app.output), true)
  test.strictEqual(/test\.js:20:11/.test(app.output), true)
  test.strictEqual(/ {2}---/.test(app.output), true)
  done()
})

test('should not output "message" if empty', function (done) {
  var app = fixture()
  var err = new Error('')
  app.emit('fail', app, extend(failing, { reason: err }))

  var result = [
    '# :( some failing test',
    'not ok 23 - some failing test',
    '  ---',
    '  name: Error',
    '  at: Object.<anonymous> (test.js:70:13)',
    '  ...',
    ''
  ].join('\n')
  test.strictEqual(app.output, result)
  done()
})

test('should output "expected" when err.expected exist', function (done) {
  var error = new Error('sasa bar')
  error.expected = 'barry123zeta'

  var app = fixture()
  app.emit('fail', app, extend(failing, {
    reason: error
  }))

  test.strictEqual(/name: Error/.test(app.output), true)
  test.strictEqual(/message: sasa bar/.test(app.output), true)
  test.strictEqual(/expected: 'barry123zeta'/.test(app.output), true)
  test.strictEqual(/actual:/.test(app.output), false)
  done()
})

test('should output "actual" if exist', function (done) {
  var app = fixture()
  var err = new Error("123 === 'baz'")
  err.actual = 123
  err.expected = 'baz'

  app.emit('fail', app, extend(failing, { reason: err }))

  test.strictEqual(/ {2}actual: 123/.test(app.output), true)
  test.strictEqual(/ {2}expected: 'baz'/.test(app.output), true)
  test.strictEqual(/ {2}message: 123 === 'baz'/.test(app.output), true)
  done()
})

test('should output "stack" with relative paths if opts.showStack: true', function (done) {
  var app = fixture({
    showStack: true
  })
  app.emit('fail', app, failing)

  test.strictEqual(/ {2}stack:/.test(app.output), true)
  test.strictEqual(/ {4}at Object\.tryCatch/.test(app.output), true)
  test.strictEqual(/ {4}at Object\.tryCatch/.test(app.output), true)
  test.strictEqual(/test.js:/.test(app.output), true)
  done()
})

test('should handle failing test suite with finish event', function (done) {
  var app = fixture({
    stats: {
      count: 4,
      pass: 3,
      fail: 1
    }
  })

  app.emit('finish', app)

  test.strictEqual(/1\.\.4/.test(app.output), true)
  test.strictEqual(/# tests 4/.test(app.output), true)
  test.strictEqual(/# pass 3/.test(app.output), true)
  test.strictEqual(/# fail 1/.test(app.output), true)
  test.strictEqual(/# ok/.test(app.output), false)
  done()
})

test('should output passing test suite', function (done) {
  var app = fixture()
  app.stats = {
    count: 3,
    pass: 3,
    fail: 0
  }

  app.emit('finish', app)

  test.strictEqual(/# tests 3/.test(app.output), true)
  test.strictEqual(/# pass 3/.test(app.output), true)
  test.strictEqual(/# ok/.test(app.output), true)
  test.strictEqual(/# fail/.test(app.output), false)
  done()
})
