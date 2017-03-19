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
  }
}

function hasOwn (self, key) {
  return Object.prototype.hasOwnProperty.call(self, key)
}
