/*!
 * dush-tap-report <https://github.com/tunnckoCore/dush-tap-report>
 *
 * Copyright (c) Charlike Mike Reagent <@tunnckoCore> (https://i.am.charlike.online)
 * Released under the MIT license.
 */

'use strict'

var util = require('util')
var extend = require('extend-shallow')
var stackdata = require('stacktrace-metadata')

/**
 * > A simple TAP report producing plugin for [dush][] or anything based on it.
 * It returns a function that can be passed to dush's `.use` method. This plugin
 * will also work for [minibase][] and [base][] mini frameworks for building robust apps.
 *
 * **Example**
 *
 * ```js
 * const reporter = require('dush-tap-report')
 * const dush = require('dush')
 *
 * const app = dush()
 *
 * // provide a fake stats object
 * // so `finish` to work correctly
 * app.use(reporter({
 *   stats: {
 *     count: 3,
 *     pass: 2,
 *     fail: 1
 *   }
 * }))
 *
 * const item = {
 *   index: 1,
 *   title: 'some passing test'
 * }
 * const failing = {
 *   index: 2,
 *   title: 'failing test, sorry',
 *   reason: new Error('some sad error here')
 * }
 * const item2 = {
 *   index: 3,
 *   title: 'awesome test is okey'
 * }
 *
 * app.emit('start', app)
 * // => 'TAP version 13'
 *
 * app.emit('pass', app, item)
 * // =>
 * // # :) some passing test
 * // ok 1 - some passing test
 *
 * app.emit('fail', app, failing)
 * // =>
 * // # :( failing test, sorry
 * // not ok 2 - failing test, sorry
 *
 * app.emit('pass', app, item2)
 * // =>
 * // # :) awesome test is okey
 * // ok 3 - awesome test is okey
 *
 * app.emit('finish', app)
 * // =>
 * // 1..3
 * // # tests 3
 * // # pass  2
 * // # fail  1
 * ```
 *
 * @param  {Object} `options` optional options, merged with `app.options`,
 *                            passed to [stacktrace-metadata][] and [find-callsite][]
 * @param  {Function} `options.writeLine` a logger function called on each line, default `console.log`
 * @param  {Boolean} `options.cleanStack` if `false` won't clean stack trace from node internals,
 *                                        [clean-stacktrace][]
 * @param  {Boolean} `options.shortStack` if `false` full stack traces, otherwise they are just four
 * @param  {Boolean} `options.showStack` if `false` the error.stack will be empty string
 * @param  {Boolean} `options.relativePaths` if `false` paths in stack traces will be absolute,
 *                                           [clean-stacktrace-relative-paths][]
 * @param  {Function} `options.mapper` called on each line of the stack with `(line, index)` signature
 * @param  {String} `options.cwd` current working directory, default `process.cwd()`
 * @return {Function} a plugin function that should be
 *                    passed to `.use` method of [minibase][], [base][] or [dush][]
 * @api public
 */

module.exports = function tapReport (options) {
  return function tapReport_ (app) {
    app.options = extend({
      writeLine: console.log
    }, app.options, options)

    var log = app.options.writeLine

    app.once('start', function start (app) {
      log('TAP version 13')
    })

    app.on('pass', function onPass (app, test) {
      log('# :)', test.title)
      log('ok', test.index, '-', test.title)
    })
    app.on('fail', function onFail (app, test) {
      log('# :(', test.title)
      log('not ok', test.index, '-', test.title)

      var err = stackdata(test.reason, app.options)

      log('  ---')
      log('  name:', err.name)

      if (hasOwn(err, 'message') && err.message.length) {
        log('  message:', err.message)
      }
      if (hasOwn(err, 'expected')) {
        log('  expected:', util.inspect(err.expected))
      }
      if (hasOwn(err, 'actual')) {
        log('  actual:', util.inspect(err.actual))
      }
      /* istanbul ignore else */
      if (hasOwn(err, 'at')) {
        log('  at:', err.at)
      } else {
        app.options.showStack = true
      }

      if (app.options.showStack) {
        log('  stack:')
        err.stack.split('\n').slice(1).map(function (str) {
          log(str)
        })
      }

      log('  ...')
    })

    app.once('finish', function finish (app) {
      var stats = app.stats || app.options.stats

      log('')
      log('1..' + stats.count)
      log('# tests', stats.count)
      log('# pass', stats.pass)

      if (stats.fail) {
        log('# fail', stats.fail)
        log('')
      } else {
        log('')
        log('# ok')
      }
    })

    return app
  }
}

function hasOwn (self, key) {
  return Object.prototype.hasOwnProperty.call(self, key)
}
