;(function (f) {
  if (typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = f()
  } else if (typeof define === 'function' && define.amd) {
    define([], f)
  } else {
    var g
    if (typeof window !== 'undefined') {
      g = window
    } else if (typeof global !== 'undefined') {
      g = global
    } else if (typeof self !== 'undefined') {
      g = self
    } else {
      g = this
    }
    g.functionPlot = f()
  }
})(function () {
  var define, module, exports
  return (function e (t, n, r) {
    function s (o, u) {
      if (!n[o]) {
        if (!t[o]) {
          var a = typeof require == 'function' && require
          if (!u && a) return a(o, !0)
          if (i) return i(o, !0)
          var f = new Error("Cannot find module '" + o + "'")
          throw ((f.code = 'MODULE_NOT_FOUND'), f)
        }
        var l = (n[o] = { exports: {} })
        t[o][0].call(
          l.exports,
          function (e) {
            var n = t[o][1][e]
            return s(n ? n : e)
          },
          l,
          l.exports,
          e,
          t,
          n,
          r
        )
      }
      return n[o].exports
    }
    var i = typeof require == 'function' && require
    for (var o = 0; o < r.length; o++) s(r[o])
    return s
  })(
    {
      1: [
        function (require, module, exports) {
          module.exports = require('./lib/')
        },
        { './lib/': 14 }
      ],
      2: [
        function (require, module, exports) {
          var isObject = require('is-object')
          module.exports = function (d) {
            if (!isObject(d)) {
              throw Error('datum is not an object')
            }
            if (!d.hasOwnProperty('graphType')) {
              d.graphType = 'interval'
            }
            if (!d.hasOwnProperty('sampler')) {
              d.sampler = d.graphType !== 'interval' ? 'builtIn' : 'interval'
            }
            if (!d.hasOwnProperty('fnType')) {
              d.fnType = 'linear'
            }
            return d
          }
        },
        { 'is-object': 52 }
      ],
      3: [
        function (require, module, exports) {
          'use strict'
          var globals = require('./globals')
          var evalTypeFn = {
            interval: require('./samplers/interval'),
            builtIn: require('./samplers/builtIn')
          }
          function computeEndpoints (chart, d) {
            var range = d.range || [-Infinity, Infinity]
            var scale = chart.meta.xScale
            var start = Math.max(scale.domain()[0], range[0])
            var end = Math.min(scale.domain()[1], range[1])
            return [start, end]
          }
          function evaluate (chart, d) {
            var range = computeEndpoints(chart, d)
            var data
            var evalFn = evalTypeFn[d.sampler]
            var nSamples =
              d.nSamples ||
              Math.min(
                globals.MAX_ITERATIONS,
                globals.DEFAULT_ITERATIONS || chart.meta.width * 2
              )
            data = evalFn(chart, d, range, nSamples)
            chart.emit('eval', data, d.index, d.isHelper)
            return data
          }
          module.exports = evaluate
        },
        { './globals': 4, './samplers/builtIn': 19, './samplers/interval': 20 }
      ],
      4: [
        function (require, module, exports) {
          'use strict'
          var d3 = window.d3
          var Globals = {
            COLORS: [
              'steelblue',
              'red',
              '#05b378',
              'orange',
              '#4040e8',
              'yellow',
              'brown',
              'magenta',
              'cyan'
            ].map(function (v) {
              return d3.hsl(v)
            }),
            DEFAULT_WIDTH: 550,
            DEFAULT_HEIGHT: 350,
            TIP_X_EPS: 1
          }
          Globals.DEFAULT_ITERATIONS = null
          Globals.MAX_ITERATIONS = Globals.DEFAULT_WIDTH * 4
          module.exports = Globals
        },
        {}
      ],
      5: [
        function (require, module, exports) {
          'use strict'
          module.exports = {
            polyline: require('./polyline'),
            interval: require('./interval'),
            scatter: require('./scatter')
          }
        },
        { './interval': 6, './polyline': 7, './scatter': 8 }
      ],
      6: [
        function (require, module, exports) {
          'use strict'
          var d3 = window.d3
          var evaluate = require('../evaluate')
          var utils = require('../utils')
          module.exports = function (chart) {
            var minWidthHeight
            var xScale = chart.meta.xScale
            var yScale = chart.meta.yScale
            function clampRange (vLo, vHi, gLo, gHi) {
              if (gLo > gHi) {
                var t = gLo
                gLo = gHi
                gHi = t
              }
              var hi = Math.min(vHi, gHi)
              var lo = Math.max(vLo, gLo)
              if (lo > hi) {
                return [-minWidthHeight, 0]
              }
              return [lo, hi]
            }
            var line = function (points, closed) {
              var path = ''
              var range = yScale.range()
              var minY = Math.min.apply(Math, range)
              var maxY = Math.max.apply(Math, range)
              for (var i = 0, length = points.length; i < length; i += 1) {
                if (points[i]) {
                  var x = points[i][0]
                  var y = points[i][1]
                  var yLo = y.lo
                  var yHi = y.hi
                  if (closed) {
                    yLo = Math.min(yLo, 0)
                    yHi = Math.max(yHi, 0)
                  }
                  var moveX = xScale(x.lo) + points.scaledDx / 2
                  var viewportY = clampRange(
                    minY,
                    maxY,
                    isFinite(yHi) ? yScale(yHi) : -Infinity,
                    isFinite(yLo) ? yScale(yLo) : Infinity
                  )
                  var vLo = viewportY[0]
                  var vHi = viewportY[1]
                  path += ' M ' + moveX + ' ' + vLo
                  path += ' v ' + Math.max(vHi - vLo, minWidthHeight)
                }
              }
              return path
            }
            function plotLine (selection) {
              selection.each(function (d) {
                var el = (plotLine.el = d3.select(this))
                var index = d.index
                var closed = d.closed
                var evaluatedData = evaluate(chart, d)
                var innerSelection = el
                  .selectAll(':scope > path.line')
                  .data(evaluatedData)
                minWidthHeight = Math.max(evaluatedData[0].scaledDx, 1)
                innerSelection
                  .enter()
                  .append('path')
                  .attr('class', 'line line-' + index)
                  .attr('fill', 'none')
                innerSelection
                  .attr('stroke-width', minWidthHeight)
                  .attr('stroke', utils.color(d, index))
                  .attr('opacity', closed ? 0.5 : 1)
                  .attr('d', function (d) {
                    return line(d, closed)
                  })
                  .attr(d.attr)
                innerSelection.exit().remove()
              })
            }
            return plotLine
          }
        },
        { '../evaluate': 3, '../utils': 22 }
      ],
      7: [
        function (require, module, exports) {
          'use strict'
          var d3 = window.d3
          var evaluate = require('../evaluate')
          var utils = require('../utils')
          var clamp = require('clamp')
          module.exports = function (chart) {
            var xScale = chart.meta.xScale
            var yScale = chart.meta.yScale
            function plotLine (selection) {
              selection.each(function (d) {
                var el = (plotLine.el = d3.select(this))
                var index = d.index
                var evaluatedData = evaluate(chart, d)
                var color = utils.color(d, index)
                var innerSelection = el
                  .selectAll(':scope > path.line')
                  .data(evaluatedData)
                var yRange = yScale.range()
                var yMax = yRange[0] + 1
                var yMin = yRange[1] - 1
                if (d.skipBoundsCheck) {
                  yMax = Infinity
                  yMin = -Infinity
                }
                function y (d) {
                  return clamp(yScale(d[1]), yMin, yMax)
                }
                var line = d3.svg
                  .line()
                  .interpolate('linear')
                  .x(function (d) {
                    return xScale(d[0])
                  })
                  .y(y)
                var area = d3.svg
                  .area()
                  .x(function (d) {
                    return xScale(d[0])
                  })
                  .y0(yScale(0))
                  .y1(y)
                innerSelection
                  .enter()
                  .append('path')
                  .attr('class', 'line line-' + index)
                  .attr('stroke-width', 1)
                  .attr('stroke-linecap', 'round')
                innerSelection
                  .each(function () {
                    var path = d3.select(this)
                    var pathD
                    if (d.closed) {
                      path.attr('fill', color)
                      path.attr('fill-opacity', 0.3)
                      pathD = area
                    } else {
                      path.attr('fill', 'none')
                      pathD = line
                    }
                    path
                      .attr('stroke', color)
                      .attr('marker-end', function () {
                        return d.fnType === 'vector'
                          ? 'url(#' + chart.markerId + ')'
                          : null
                      })
                      .attr('d', pathD)
                  })
                  .attr(d.attr)
                innerSelection.exit().remove()
              })
            }
            return plotLine
          }
        },
        { '../evaluate': 3, '../utils': 22, clamp: 29 }
      ],
      8: [
        function (require, module, exports) {
          'use strict'
          var d3 = window.d3
          var evaluate = require('../evaluate')
          var utils = require('../utils')
          module.exports = function (chart) {
            var xScale = chart.meta.xScale
            var yScale = chart.meta.yScale
            function scatter (selection) {
              selection.each(function (d) {
                var i, j
                var index = d.index
                var color = utils.color(d, index)
                var evaluatedData = evaluate(chart, d)
                var joined = []
                for (i = 0; i < evaluatedData.length; i += 1) {
                  for (j = 0; j < evaluatedData[i].length; j += 1) {
                    joined.push(evaluatedData[i][j])
                  }
                }
                var innerSelection = d3
                  .select(this)
                  .selectAll(':scope > circle')
                  .data(joined)
                innerSelection.enter().append('circle')
                innerSelection
                  .attr('fill', d3.hsl(color.toString()).brighter(1.5))
                  .attr('stroke', color)
                  .attr('opacity', 0.7)
                  .attr('r', 1)
                  .attr('cx', function (d) {
                    return xScale(d[0])
                  })
                  .attr('cy', function (d) {
                    return yScale(d[1])
                  })
                  .attr(d.attr)
                innerSelection.exit().remove()
              })
            }
            return scatter
          }
        },
        { '../evaluate': 3, '../utils': 22 }
      ],
      9: [
        function (require, module, exports) {
          'use strict'
          var d3 = window.d3
          module.exports = function (options) {
            var annotations
            var xScale = options.owner.meta.xScale
            var yScale = options.owner.meta.yScale
            var line = d3.svg
              .line()
              .x(function (d) {
                return d[0]
              })
              .y(function (d) {
                return d[1]
              })
            annotations = function (parentSelection) {
              parentSelection.each(function () {
                var current = d3.select(this)
                var selection = current
                  .selectAll('g.annotations')
                  .data(function (d) {
                    return d.annotations || []
                  })
                selection
                  .enter()
                  .append('g')
                  .attr('class', 'annotations')
                var yRange = yScale.range()
                var xRange = xScale.range()
                var path = selection.selectAll('path').data(function (d) {
                  if (d.hasOwnProperty('x')) {
                    return [
                      [
                        [0, yRange[0]],
                        [0, yRange[1]]
                      ]
                    ]
                  } else {
                    return [
                      [
                        [xRange[0], 0],
                        [xRange[1], 0]
                      ]
                    ]
                  }
                })
                path
                  .enter()
                  .append('path')
                  .attr('stroke', '#eee')
                  .attr('d', line)
                path.exit().remove()
                var text = selection.selectAll('text').data(function (d) {
                  return [{ text: d.text || '', hasX: d.hasOwnProperty('x') }]
                })
                text
                  .enter()
                  .append('text')
                  .attr('y', function (d) {
                    return d.hasX ? 3 : 0
                  })
                  .attr('x', function (d) {
                    return d.hasX ? 0 : 3
                  })
                  .attr('dy', function (d) {
                    return d.hasX ? 5 : -5
                  })
                  .attr('text-anchor', function (d) {
                    return d.hasX ? 'end' : ''
                  })
                  .attr('transform', function (d) {
                    return d.hasX ? 'rotate(-90)' : ''
                  })
                  .text(function (d) {
                    return d.text
                  })
                text.exit().remove()
                selection.attr('transform', function (d) {
                  if (d.hasOwnProperty('x')) {
                    return 'translate(' + xScale(d.x) + ', 0)'
                  } else {
                    return 'translate(0, ' + yScale(d.y) + ')'
                  }
                })
                selection.exit().remove()
              })
            }
            return annotations
          }
        },
        {}
      ],
      10: [
        function (require, module, exports) {
          'use strict'
          var d3 = window.d3
          var builtInEvaluator = require('./eval').builtIn
          var polyline = require('../graph-types/polyline')
          var datumDefaults = require('../datum-defaults')
          module.exports = function (chart) {
            var derivativeDatum = datumDefaults({
              isHelper: true,
              skipTip: true,
              skipBoundsCheck: true,
              nSamples: 2,
              graphType: 'polyline'
            })
            var derivative
            function computeLine (d) {
              if (!d.derivative) {
                return []
              }
              var x0 =
                typeof d.derivative.x0 === 'number' ? d.derivative.x0 : Infinity
              derivativeDatum.index = d.index
              derivativeDatum.scope = {
                m: builtInEvaluator(d.derivative, 'fn', { x: x0 }),
                x0: x0,
                y0: builtInEvaluator(d, 'fn', { x: x0 })
              }
              derivativeDatum.fn = 'm * (x - x0) + y0'
              return [derivativeDatum]
            }
            function checkAutoUpdate (d) {
              var self = this
              if (!d.derivative) {
                return
              }
              if (
                d.derivative.updateOnMouseMove &&
                !d.derivative.$$mouseListener
              ) {
                d.derivative.$$mouseListener = function (x0) {
                  d.derivative.x0 = x0
                  derivative(self)
                }
                chart.on('tip:update', d.derivative.$$mouseListener)
              }
            }
            derivative = function (selection) {
              selection.each(function (d) {
                var el = d3.select(this)
                var data = computeLine.call(selection, d)
                checkAutoUpdate.call(selection, d)
                var innerSelection = el.selectAll('g.derivative').data(data)
                innerSelection
                  .enter()
                  .append('g')
                  .attr('class', 'derivative')
                innerSelection.call(polyline(chart))
                innerSelection.selectAll('path').attr('opacity', 0.5)
                innerSelection.exit().remove()
              })
            }
            return derivative
          }
        },
        { '../datum-defaults': 2, '../graph-types/polyline': 7, './eval': 11 }
      ],
      11: [
        function (require, module, exports) {
          'use strict'
          var samplers = {
            interval: require('interval-arithmetic-eval'),
            builtIn: require('built-in-math-eval')
          }
          var extend = require('extend')
          window.math && (samplers.builtIn = window.math.compile)
          function generateEvaluator (samplerName) {
            function doCompile (expression) {
              if (typeof expression === 'string') {
                var compile = samplers[samplerName]
                return compile(expression)
              } else if (typeof expression === 'function') {
                return { eval: expression }
              } else {
                throw Error('expression must be a string or a function')
              }
            }
            function compileIfPossible (meta, property) {
              var expression = meta[property]
              var hiddenProperty = samplerName + '_Expression_' + property
              var hiddenCompiled = samplerName + '_Compiled_' + property
              if (expression !== meta[hiddenProperty]) {
                meta[hiddenProperty] = expression
                meta[hiddenCompiled] = doCompile(expression)
              }
            }
            function getCompiledExpression (meta, property) {
              return meta[samplerName + '_Compiled_' + property]
            }
            function evaluate (meta, property, variables) {
              compileIfPossible(meta, property)
              return getCompiledExpression(meta, property).eval(
                extend({}, meta.scope || {}, variables)
              )
            }
            return evaluate
          }
          module.exports.builtIn = generateEvaluator('builtIn')
          module.exports.interval = generateEvaluator('interval')
        },
        { 'built-in-math-eval': 26, extend: 32, 'interval-arithmetic-eval': 36 }
      ],
      12: [
        function (require, module, exports) {
          'use strict'
          var d3 = window.d3
          var derivative = require('./derivative')
          var secant = require('./secant')
          module.exports = function (chart) {
            function helper (selection) {
              selection.each(function () {
                var el = d3.select(this)
                el.call(derivative(chart))
                el.call(secant(chart))
              })
            }
            return helper
          }
        },
        { './derivative': 10, './secant': 13 }
      ],
      13: [
        function (require, module, exports) {
          'use strict'
          var d3 = window.d3
          var extend = require('extend')
          var builtInEvaluator = require('./eval').builtIn
          var datumDefaults = require('../datum-defaults')
          var polyline = require('../graph-types/polyline')
          module.exports = function (chart) {
            var secantDefaults = datumDefaults({
              isHelper: true,
              skipTip: true,
              skipBoundsCheck: true,
              nSamples: 2,
              graphType: 'polyline'
            })
            var secant
            function computeSlope (scope) {
              scope.m = (scope.y1 - scope.y0) / (scope.x1 - scope.x0)
            }
            function updateLine (d, secant) {
              if (!secant.hasOwnProperty('x0')) {
                throw Error('secant must have the property `x0` defined')
              }
              secant.scope = secant.scope || {}
              var x0 = secant.x0
              var x1 = typeof secant.x1 === 'number' ? secant.x1 : Infinity
              extend(secant.scope, {
                x0: x0,
                x1: x1,
                y0: builtInEvaluator(d, 'fn', { x: x0 }),
                y1: builtInEvaluator(d, 'fn', { x: x1 })
              })
              computeSlope(secant.scope)
            }
            function setFn (d, secant) {
              updateLine(d, secant)
              secant.fn = 'm * (x - x0) + y0'
            }
            function setMouseListener (d, secantObject) {
              var self = this
              if (
                secantObject.updateOnMouseMove &&
                !secantObject.$$mouseListener
              ) {
                secantObject.$$mouseListener = function (x1) {
                  secantObject.x1 = x1
                  updateLine(d, secantObject)
                  secant(self)
                }
                chart.on('tip:update', secantObject.$$mouseListener)
              }
            }
            function computeLines (d) {
              var self = this
              var data = []
              d.secants = d.secants || []
              for (var i = 0; i < d.secants.length; i += 1) {
                var secant = (d.secants[i] = extend(
                  {},
                  secantDefaults,
                  d.secants[i]
                ))
                secant.index = d.index
                if (!secant.fn) {
                  setFn.call(self, d, secant)
                  setMouseListener.call(self, d, secant)
                }
                data.push(secant)
              }
              return data
            }
            secant = function (selection) {
              selection.each(function (d) {
                var el = d3.select(this)
                var data = computeLines.call(selection, d)
                var innerSelection = el.selectAll('g.secant').data(data)
                innerSelection
                  .enter()
                  .append('g')
                  .attr('class', 'secant')
                innerSelection.call(polyline(chart))
                innerSelection.selectAll('path').attr('opacity', 0.5)
                innerSelection.exit().remove()
              })
            }
            return secant
          }
        },
        {
          '../datum-defaults': 2,
          '../graph-types/polyline': 7,
          './eval': 11,
          extend: 32
        }
      ],
      14: [
        function (require, module, exports) {
          'use strict'
          require('./polyfills')
          var d3 = window.d3
          var events = require('events')
          var extend = require('extend')
          var mousetip = require('./tip')
          var helpers = require('./helpers/')
          var annotations = require('./helpers/annotations')
          var datumDefaults = require('./datum-defaults')
          var globals
          var graphTypes
          var cache = []
          module.exports = function (options) {
            options = options || {}
            options.data = options.data || []
            var width, height
            var margin
            var zoomBehavior
            var xScale, yScale
            var line = d3.svg
              .line()
              .x(function (d) {
                return xScale(d[0])
              })
              .y(function (d) {
                return yScale(d[1])
              })
            function Chart () {
              var n = Math.random()
              var letter = String.fromCharCode(Math.floor(n * 26) + 97)
              this.id = options.id = letter + n.toString(16).substr(2)
              this.linkedGraphs = [this]
              this.options = options
              cache[this.id] = this
              this.setUpEventListeners()
            }
            Chart.prototype = Object.create(events.prototype)
            Chart.prototype.build = function () {
              this.internalVars()
              this.drawGraphWrapper()
              return this
            }
            Chart.prototype.initializeAxes = function () {
              var integerFormat = d3.format('s')
              var format = function (scale) {
                return function (d) {
                  var decimalFormat = scale.tickFormat(10)
                  var isInteger = d === +d && d === (d | 0)
                  return isInteger ? integerFormat(d) : decimalFormat(d)
                }
              }
              function computeYScale (xScale) {
                var xDiff = xScale[1] - xScale[0]
                return (height * xDiff) / width
              }
              options.xAxis = options.xAxis || {}
              options.xAxis.type = options.xAxis.type || 'linear'
              options.yAxis = options.yAxis || {}
              options.yAxis.type = options.yAxis.type || 'linear'
              var xDomain = (this.meta.xDomain = (function (axis) {
                if (axis.domain) {
                  return axis.domain
                }
                if (axis.type === 'linear') {
                  var xLimit = 12
                  return [-xLimit / 2, xLimit / 2]
                } else if (axis.type === 'log') {
                  return [1, 10]
                }
                throw Error('axis type ' + axis.type + ' unsupported')
              })(options.xAxis))
              var yDomain = (this.meta.yDomain = (function (axis) {
                if (axis.domain) {
                  return axis.domain
                }
                var yLimit = computeYScale(xDomain)
                if (axis.type === 'linear') {
                  return [-yLimit / 2, yLimit / 2]
                } else if (axis.type === 'log') {
                  return [1, 10]
                }
                throw Error('axis type ' + axis.type + ' unsupported')
              })(options.yAxis))
              if (xDomain[0] >= xDomain[1]) {
                throw Error('the pair defining the x-domain is inverted')
              }
              if (yDomain[0] >= yDomain[1]) {
                throw Error('the pair defining the y-domain is inverted')
              }
              xScale = this.meta.xScale = d3.scale[options.xAxis.type]()
                .domain(xDomain)
                .range(options.xAxis.invert ? [width, 0] : [0, width])
              yScale = this.meta.yScale = d3.scale[options.yAxis.type]()
                .domain(yDomain)
                .range(options.yAxis.invert ? [0, height] : [height, 0])
              this.meta.xAxis = d3.svg
                .axis()
                .scale(xScale)
                .tickSize(options.grid ? -height : 0)
                .tickFormat(format(xScale))
                .orient('bottom')
              this.meta.yAxis = d3.svg
                .axis()
                .scale(yScale)
                .tickSize(options.grid ? -width : 0)
                .tickFormat(format(yScale))
                .orient('left')
            }
            Chart.prototype.internalVars = function () {
              this.meta = {}
              margin = this.meta.margin = {
                left: 30,
                right: 30,
                top: 20,
                bottom: 20
              }
              if (options.title) {
                this.meta.margin.top = 40
              }
              zoomBehavior = this.meta.zoomBehavior = d3.behavior.zoom()
              width = this.meta.width =
                (options.width || globals.DEFAULT_WIDTH) -
                margin.left -
                margin.right
              height = this.meta.height =
                (options.height || globals.DEFAULT_HEIGHT) -
                margin.top -
                margin.bottom
              this.initializeAxes()
            }
            Chart.prototype.drawGraphWrapper = function () {
              var root = (this.root = d3
                .select(options.target)
                .selectAll('svg')
                .data([options]))
              this.root.enter = root
                .enter()
                .append('svg')
                .attr('class', 'function-plot')
                .attr('font-size', this.getFontSize())
              root
                .attr('width', width + margin.left + margin.right)
                .attr('height', height + margin.top + margin.bottom)
              this.buildTitle()
              this.buildLegend()
              this.buildCanvas()
              this.buildClip()
              this.buildAxis()
              this.buildAxisLabel()
              this.draw()
              var tip = (this.tip = mousetip(
                extend(options.tip, { owner: this })
              ))
              this.canvas.call(tip)
              this.buildZoomHelper()
              this.setUpPlugins()
            }
            Chart.prototype.buildTitle = function () {
              var selection = this.root
                .selectAll('text.title')
                .data(function (d) {
                  return [d.title].filter(Boolean)
                })
              selection
                .enter()
                .append('text')
                .attr('class', 'title')
                .attr('y', margin.top / 2)
                .attr('x', margin.left + width / 2)
                .attr('font-size', 25)
                .attr('text-anchor', 'middle')
                .attr('alignment-baseline', 'middle')
                .text(options.title)
              selection.exit().remove()
            }
            Chart.prototype.buildLegend = function () {
              this.root.enter
                .append('text')
                .attr('class', 'top-right-legend')
                .attr('text-anchor', 'end')
              this.root
                .select('.top-right-legend')
                .attr('y', margin.top / 2)
                .attr('x', width + margin.left)
            }
            Chart.prototype.buildCanvas = function () {
              var self = this
              this.meta.zoomBehavior
                .x(xScale)
                .y(yScale)
                .on('zoom', function onZoom () {
                  self.emit('all:zoom', d3.event.translate, d3.event.scale)
                })
              var canvas = (this.canvas = this.root
                .selectAll('.canvas')
                .data(function (d) {
                  return [d]
                }))
              this.canvas.enter = canvas
                .enter()
                .append('g')
                .attr('class', 'canvas')
            }
            Chart.prototype.buildClip = function () {
              var id = this.id
              var defs = this.canvas.enter.append('defs')
              defs
                .append('clipPath')
                .attr('id', 'function-plot-clip-' + id)
                .append('rect')
                .attr('class', 'clip static-clip')
              this.canvas
                .selectAll('.clip')
                .attr('width', width)
                .attr('height', height)
              this.markerId = this.id + '-marker'
              defs
                .append('clipPath')
                .append('marker')
                .attr('id', this.markerId)
                .attr('viewBox', '0 -5 10 10')
                .attr('refX', 10)
                .attr('markerWidth', 5)
                .attr('markerHeight', 5)
                .attr('orient', 'auto')
                .append('svg:path')
                .attr('d', 'M0,-5L10,0L0,5L0,0')
                .attr('stroke-width', '0px')
                .attr('fill-opacity', 1)
                .attr('fill', '#777')
            }
            Chart.prototype.buildAxis = function () {
              var canvasEnter = this.canvas.enter
              canvasEnter.append('g').attr('class', 'x axis')
              canvasEnter.append('g').attr('class', 'y axis')
              this.canvas
                .select('.x.axis')
                .attr('transform', 'translate(0,' + height + ')')
                .call(this.meta.xAxis)
              this.canvas.select('.y.axis').call(this.meta.yAxis)
            }
            Chart.prototype.buildAxisLabel = function () {
              var xLabel, yLabel
              var canvas = this.canvas
              xLabel = canvas.selectAll('text.x.axis-label').data(function (d) {
                return [d.xAxis.label].filter(Boolean)
              })
              xLabel
                .enter()
                .append('text')
                .attr('class', 'x axis-label')
                .attr('text-anchor', 'end')
              xLabel
                .attr('x', width)
                .attr('y', height - 6)
                .text(function (d) {
                  return d
                })
              xLabel.exit().remove()
              yLabel = canvas.selectAll('text.y.axis-label').data(function (d) {
                return [d.yAxis.label].filter(Boolean)
              })
              yLabel
                .enter()
                .append('text')
                .attr('class', 'y axis-label')
                .attr('y', 6)
                .attr('dy', '.75em')
                .attr('text-anchor', 'end')
                .attr('transform', 'rotate(-90)')
              yLabel.text(function (d) {
                return d
              })
              yLabel.exit().remove()
            }
            Chart.prototype.buildContent = function () {
              var self = this
              var canvas = this.canvas
              canvas
                .attr(
                  'transform',
                  'translate(' + margin.left + ',' + margin.top + ')'
                )
                .call(zoomBehavior)
                .each(function () {
                  var el = d3.select(this)
                  var listeners = [
                    'mousedown',
                    'touchstart',
                    'onwheel' in document
                      ? 'wheel'
                      : 'ononmousewheel' in document
                      ? 'mousewheel'
                      : 'MozMousePixelScroll'
                  ].map(function (d) {
                    return d + '.zoom'
                  })
                  if (!el._zoomListenersCache) {
                    listeners.forEach(function (l) {
                      el['_' + l] = el.on(l)
                    })
                    el._zoomListenersCache = true
                  }
                  function setState (state) {
                    listeners.forEach(function (l) {
                      state ? el.on(l, el['_' + l]) : el.on(l, null)
                    })
                  }
                  setState(!options.disableZoom)
                })
              var content = (this.content = canvas
                .selectAll(':scope > g.content')
                .data(function (d) {
                  return [d]
                }))
              content
                .enter()
                .append('g')
                .attr('clip-path', 'url(#function-plot-clip-' + this.id + ')')
                .attr('class', 'content')
              if (options.xAxis.type === 'linear') {
                var yOrigin = content.selectAll(':scope > path.y.origin').data([
                  [
                    [0, yScale.domain()[0]],
                    [0, yScale.domain()[1]]
                  ]
                ])
                yOrigin
                  .enter()
                  .append('path')
                  .attr('class', 'y origin')
                  .attr('stroke', 'black')
                  .attr('opacity', 0.2)
                yOrigin.attr('d', line)
              }
              if (options.yAxis.type === 'linear') {
                var xOrigin = content.selectAll(':scope > path.x.origin').data([
                  [
                    [xScale.domain()[0], 0],
                    [xScale.domain()[1], 0]
                  ]
                ])
                xOrigin
                  .enter()
                  .append('path')
                  .attr('class', 'x origin')
                  .attr('stroke', 'black')
                  .attr('opacity', 0.2)
                xOrigin.attr('d', line)
              }
              content.call(annotations({ owner: self }))
              var graphs = content
                .selectAll(':scope > g.graph')
                .data(function (d) {
                  return d.data.map(datumDefaults)
                })
              graphs
                .enter()
                .append('g')
                .attr('class', 'graph')
              graphs.each(function (d, index) {
                d.index = index
                d3.select(this).call(graphTypes[d.graphType](self))
                d3.select(this).call(helpers(self))
              })
            }
            Chart.prototype.buildZoomHelper = function () {
              var self = this
              this.draggable = this.canvas.enter
                .append('rect')
                .attr('class', 'zoom-and-drag')
                .style('fill', 'none')
                .style('pointer-events', 'all')
              this.canvas
                .select('.zoom-and-drag')
                .attr('width', width)
                .attr('height', height)
                .on('mouseover', function () {
                  self.emit('all:mouseover')
                })
                .on('mouseout', function () {
                  self.emit('all:mouseout')
                })
                .on('mousemove', function () {
                  self.emit('all:mousemove')
                })
            }
            Chart.prototype.setUpPlugins = function () {
              var plugins = options.plugins || []
              var self = this
              plugins.forEach(function (plugin) {
                plugin(self)
              })
            }
            Chart.prototype.addLink = function () {
              for (var i = 0; i < arguments.length; i += 1) {
                this.linkedGraphs.push(arguments[i])
              }
            }
            Chart.prototype.updateAxes = function () {
              var instance = this
              var canvas = instance.canvas
              canvas.select('.x.axis').call(instance.meta.xAxis)
              canvas.select('.y.axis').call(instance.meta.yAxis)
              canvas
                .selectAll('.axis path, .axis line')
                .attr('fill', 'none')
                .attr('stroke', 'black')
                .attr('shape-rendering', 'crispedges')
                .attr('opacity', 0.1)
            }
            Chart.prototype.syncOptions = function () {
              this.options.xAxis.domain = this.meta.xScale.domain()
              this.options.yAxis.domain = this.meta.yScale.domain()
            }
            Chart.prototype.programmaticZoom = function (xDomain, yDomain) {
              var instance = this
              d3.transition()
                .duration(750)
                .tween('zoom', function () {
                  var ix = d3.interpolate(xScale.domain(), xDomain)
                  var iy = d3.interpolate(yScale.domain(), yDomain)
                  return function (t) {
                    zoomBehavior.x(xScale.domain(ix(t))).y(yScale.domain(iy(t)))
                    instance.draw()
                  }
                })
                .each('end', function () {
                  instance.emit('programmatic-zoom')
                })
            }
            Chart.prototype.getFontSize = function () {
              return Math.max(Math.max(width, height) / 50, 8)
            }
            Chart.prototype.draw = function () {
              var instance = this
              instance.emit('before:draw')
              instance.syncOptions()
              instance.updateAxes()
              instance.buildContent()
              instance.emit('after:draw')
            }
            Chart.prototype.setUpEventListeners = function () {
              var instance = this
              var events = {
                mousemove: function (coordinates) {
                  instance.tip.move(coordinates)
                },
                mouseover: function () {
                  instance.tip.show()
                },
                mouseout: function () {
                  instance.tip.hide()
                },
                zoom: function (translate, scale) {
                  zoomBehavior.translate(translate).scale(scale)
                },
                'tip:update': function (x, y, index) {
                  var meta = instance.root.datum().data[index]
                  var title = meta.title || ''
                  var format =
                    meta.renderer ||
                    function (x, y) {
                      return x.toFixed(3) + ', ' + y.toFixed(3)
                    }
                  var text = []
                  title && text.push(title)
                  text.push(format(x, y))
                  instance.root
                    .select('.top-right-legend')
                    .attr('fill', globals.COLORS[index])
                    .text(text.join(' '))
                }
              }
              var all = {
                mousemove: function () {
                  var mouse = d3.mouse(
                    instance.root.select('rect.zoom-and-drag').node()
                  )
                  var coordinates = {
                    x: xScale.invert(mouse[0]),
                    y: yScale.invert(mouse[1])
                  }
                  instance.linkedGraphs.forEach(function (graph) {
                    graph.emit('before:mousemove', coordinates)
                    graph.emit('mousemove', coordinates)
                  })
                },
                zoom: function (translate, scale) {
                  instance.linkedGraphs.forEach(function (graph, i) {
                    graph.emit('zoom', translate, scale)
                    graph.draw()
                  })
                  instance.emit('all:mousemove')
                }
              }
              Object.keys(events).forEach(function (e) {
                instance.on(e, events[e])
                !all[e] &&
                  instance.on('all:' + e, function () {
                    var args = Array.prototype.slice.call(arguments)
                    instance.linkedGraphs.forEach(function (graph) {
                      var localArgs = args.slice()
                      localArgs.unshift(e)
                      graph.emit.apply(graph, localArgs)
                    })
                  })
              })
              Object.keys(all).forEach(function (e) {
                instance.on('all:' + e, all[e])
              })
            }
            var instance = cache[options.id]
            if (!instance) {
              instance = new Chart()
            }
            return instance.build()
          }
          globals = module.exports.globals = require('./globals')
          graphTypes = module.exports.graphTypes = require('./graph-types/')
          module.exports.plugins = require('./plugins/')
          module.exports.eval = require('./helpers/eval')
        },
        {
          './datum-defaults': 2,
          './globals': 4,
          './graph-types/': 5,
          './helpers/': 12,
          './helpers/annotations': 9,
          './helpers/eval': 11,
          './plugins/': 16,
          './polyfills': 18,
          './tip': 21,
          events: 31,
          extend: 32
        }
      ],
      15: [
        function (require, module, exports) {
          var d3 = window.d3
          var extend = require('extend')
          var pressed = require('key-pressed')
          var keydown = require('keydown')
          var integrateSimpson = require('integrate-adaptive-simpson')
          module.exports = function (options) {
            options = extend({ key: '<shift>', toggle: false }, options)
            var brush = d3.svg.brush()
            var kd = keydown(options.key)
            var visible = false
            var cachedInstance
            function wrapper (datum) {
              return function (x) {
                var functionPlot = window.functionPlot
                return functionPlot.eval.builtIn(datum, 'fn', { x: x })
              }
            }
            function setBrushState (visible) {
              var brushEl = cachedInstance.canvas.selectAll(
                '.definite-integral'
              )
              brushEl.style('display', visible ? null : 'none')
            }
            function inner (instance) {
              cachedInstance = instance
              var oldDisableZoom
              brush
                .x(instance.meta.xScale)
                .on('brushstart', function () {
                  if (!d3.event.sourceEvent) return
                  oldDisableZoom = !!instance.options.disableZoom
                  instance.options.disableZoom = true
                  instance.emit('draw')
                })
                .on('brushend', function () {
                  if (!d3.event.sourceEvent) return
                  instance.options.disableZoom = oldDisableZoom
                  if (!brush.empty()) {
                    var a = brush.extent()[0]
                    var b = brush.extent()[1]
                    instance.options.data.forEach(function (datum, i) {
                      var value = integrateSimpson(
                        wrapper(datum),
                        a,
                        b,
                        options.tol,
                        options.maxdepth
                      )
                      instance.emit('definite-integral', datum, i, value, a, b)
                    })
                  }
                  instance.draw()
                })
              var brushEl = instance.canvas
                .append('g')
                .attr('class', 'brush definite-integral')
              brushEl.call(brush).call(brush.event)
              instance.canvas
                .selectAll('.brush .extent')
                .attr('stroke', '#fff')
                .attr('fill-opacity', 0.125)
                .attr('shape-rendering', 'crispEdges')
              brushEl.selectAll('rect').attr('height', instance.meta.height)
              instance.canvas.on('mousemove.definiteIntegral', function () {
                if (!options.toggle) {
                  inner.visible(pressed(options.key))
                }
              })
              kd.on('pressed', function () {
                inner.visible(options.toggle ? !inner.visible() : true)
              })
              inner.visible(false)
            }
            inner.visible = function (_) {
              if (!arguments.length) {
                return visible
              }
              visible = _
              setBrushState(_)
              return inner
            }
            return inner
          }
        },
        {
          extend: 32,
          'integrate-adaptive-simpson': 35,
          'key-pressed': 54,
          keydown: 55
        }
      ],
      16: [
        function (require, module, exports) {
          module.exports = {
            zoomBox: require('./zoom-box'),
            definiteIntegral: require('./definite-integral')
          }
        },
        { './definite-integral': 15, './zoom-box': 17 }
      ],
      17: [
        function (require, module, exports) {
          var d3 = window.d3
          var extend = require('extend')
          var pressed = require('key-pressed')
          var keydown = require('keydown')
          module.exports = function (options) {
            options = extend({ key: '<shift>', toggle: false }, options)
            var brush = d3.svg.brush()
            var kd = keydown(options.key)
            var cachedInstance
            var visible = false
            function setBrushState (visible) {
              var brushEl = cachedInstance.canvas.selectAll('.zoom-box')
              brushEl.style('display', visible ? null : 'none')
            }
            function inner (instance) {
              cachedInstance = instance
              var oldDisableZoom
              brush
                .x(instance.meta.xScale)
                .y(instance.meta.yScale)
                .on('brushstart', function () {
                  if (!d3.event.sourceEvent) return
                  oldDisableZoom = !!instance.options.disableZoom
                  instance.options.disableZoom = true
                  instance.draw()
                })
                .on('brushend', function () {
                  if (!d3.event.sourceEvent) return
                  instance.options.disableZoom = oldDisableZoom
                  if (!brush.empty()) {
                    var lo = brush.extent()[0]
                    var hi = brush.extent()[1]
                    var x = [lo[0], hi[0]]
                    var y = [lo[1], hi[1]]
                    instance.programmaticZoom(x, y)
                  }
                  d3.select(this)
                    .transition()
                    .duration(1)
                    .call(brush.clear())
                    .call(brush.event)
                })
              var brushEl = instance.canvas
                .append('g')
                .attr('class', 'brush zoom-box')
              brushEl.call(brush).call(brush.event)
              instance.canvas
                .selectAll('.brush .extent')
                .attr('stroke', '#fff')
                .attr('fill-opacity', 0.125)
                .attr('shape-rendering', 'crispEdges')
              instance.canvas.on('mousemove.zoombox', function () {
                if (!options.toggle) {
                  inner.visible(pressed(options.key))
                }
              })
              kd.on('pressed', function () {
                inner.visible(options.toggle ? !inner.visible() : true)
              })
              inner.visible(false)
            }
            inner.visible = function (_) {
              if (!arguments.length) {
                return visible
              }
              visible = _
              setBrushState(_)
              return inner
            }
            return inner
          }
        },
        { extend: 32, 'key-pressed': 54, keydown: 55 }
      ],
      18: [
        function (require, module, exports) {
          ;(function (doc, proto) {
            try {
              doc.querySelector(':scope body')
            } catch (err) {
              ;['querySelector', 'querySelectorAll'].forEach(function (method) {
                var native = proto[method]
                proto[method] = function (selectors) {
                  if (/(^|,)\s*:scope/.test(selectors)) {
                    var id = this.id
                    this.id = 'ID_' + Date.now()
                    selectors = selectors.replace(
                      /((^|,)\s*):scope/g,
                      '$1#' + this.id
                    )
                    var result = doc[method](selectors)
                    this.id = id
                    return result
                  } else {
                    return native.call(this, selectors)
                  }
                }
              })
            }
          })(window.document, Element.prototype)
        },
        {}
      ],
      19: [
        function (require, module, exports) {
          'use strict'
          var clamp = require('clamp')
          var linspace = require('linspace')
          var utils = require('../utils')
          var evaluate = require('../helpers/eval').builtIn
          function checkAsymptote (d0, d1, meta, sign, level) {
            if (!level) {
              return { asymptote: true, d0: d0, d1: d1 }
            }
            var i
            var n = 10
            var x0 = d0[0]
            var x1 = d1[0]
            var samples = linspace(x0, x1, n)
            var oldY, oldX
            for (i = 0; i < n; i += 1) {
              var x = samples[i]
              var y = evaluate(meta, 'fn', { x: x })
              if (i) {
                var deltaY = y - oldY
                var newSign = utils.sgn(deltaY)
                if (newSign === sign) {
                  return checkAsymptote(
                    [oldX, oldY],
                    [x, y],
                    meta,
                    sign,
                    level - 1
                  )
                }
              }
              oldY = y
              oldX = x
            }
            return { asymptote: false, d0: d0, d1: d1 }
          }
          function split (chart, meta, data) {
            var i, oldSign
            var deltaX
            var st = []
            var sets = []
            var domain = chart.meta.yScale.domain()
            var zoomScale = chart.meta.zoomBehavior.scale()
            var yMin = domain[0]
            var yMax = domain[1]
            if (data[0]) {
              st.push(data[0])
              deltaX = data[1][0] - data[0][0]
              oldSign = utils.sgn(data[1][1] - data[0][1])
            }
            function updateY (d) {
              d[1] = Math.min(d[1], yMax)
              d[1] = Math.max(d[1], yMin)
              return d
            }
            i = 1
            while (i < data.length) {
              var y0 = data[i - 1][1]
              var y1 = data[i][1]
              var deltaY = y1 - y0
              var newSign = utils.sgn(deltaY)
              if (
                oldSign !== newSign &&
                Math.abs(deltaY / deltaX) > 1 / zoomScale
              ) {
                var check = checkAsymptote(
                  data[i - 1],
                  data[i],
                  meta,
                  newSign,
                  3
                )
                if (check.asymptote) {
                  st.push(updateY(check.d0))
                  sets.push(st)
                  st = [updateY(check.d1)]
                }
              }
              oldSign = newSign
              st.push(data[i])
              ++i
            }
            if (st.length) {
              sets.push(st)
            }
            return sets
          }
          function linear (chart, meta, range, n) {
            var allX = utils.space(chart, range, n)
            var yDomain = chart.meta.yScale.domain()
            var yDomainMargin = yDomain[1] - yDomain[0]
            var yMin = yDomain[0] - yDomainMargin * 1e5
            var yMax = yDomain[1] + yDomainMargin * 1e5
            var data = []
            var i
            for (i = 0; i < allX.length; i += 1) {
              var x = allX[i]
              var y = evaluate(meta, 'fn', { x: x })
              if (utils.isValidNumber(x) && utils.isValidNumber(y)) {
                data.push([x, clamp(y, yMin, yMax)])
              }
            }
            data = split(chart, meta, data)
            return data
          }
          function parametric (chart, meta, range, nSamples) {
            var parametricRange = meta.range || [0, 2 * Math.PI]
            var tCoords = utils.space(chart, parametricRange, nSamples)
            var samples = []
            for (var i = 0; i < tCoords.length; i += 1) {
              var t = tCoords[i]
              var x = evaluate(meta, 'x', { t: t })
              var y = evaluate(meta, 'y', { t: t })
              samples.push([x, y])
            }
            return [samples]
          }
          function polar (chart, meta, range, nSamples) {
            var polarRange = meta.range || [-Math.PI, Math.PI]
            var thetaSamples = utils.space(chart, polarRange, nSamples)
            var samples = []
            for (var i = 0; i < thetaSamples.length; i += 1) {
              var theta = thetaSamples[i]
              var r = evaluate(meta, 'r', { theta: theta })
              var x = r * Math.cos(theta)
              var y = r * Math.sin(theta)
              samples.push([x, y])
            }
            return [samples]
          }
          function points (chart, meta, range, nSamples) {
            return [meta.points]
          }
          function vector (chart, meta, range, nSamples) {
            meta.offset = meta.offset || [0, 0]
            return [
              [
                meta.offset,
                [
                  meta.vector[0] + meta.offset[0],
                  meta.vector[1] + meta.offset[1]
                ]
              ]
            ]
          }
          var sampler = function (chart, d, range, nSamples) {
            var fnTypes = {
              parametric: parametric,
              polar: polar,
              points: points,
              vector: vector,
              linear: linear
            }
            if (!(d.fnType in fnTypes)) {
              throw Error(
                d.fnType + ' is not supported in the `builtIn` sampler'
              )
            }
            return fnTypes[d.fnType].apply(null, arguments)
          }
          module.exports = sampler
        },
        { '../helpers/eval': 11, '../utils': 22, clamp: 29, linspace: 56 }
      ],
      20: [
        function (require, module, exports) {
          'use strict'
          var intervalArithmeticEval = require('interval-arithmetic-eval')
          var Interval = intervalArithmeticEval.Interval
          var evaluate = require('../helpers/eval').interval
          var utils = require('../utils')
          intervalArithmeticEval.policies.disableRounding()
          function interval1d (chart, meta, range, nSamples) {
            var xCoords = utils.space(chart, range, nSamples)
            var xScale = chart.meta.xScale
            var yScale = chart.meta.yScale
            var yMin = yScale.domain()[0]
            var yMax = yScale.domain()[1]
            var samples = []
            var i
            for (i = 0; i < xCoords.length - 1; i += 1) {
              var x = { lo: xCoords[i], hi: xCoords[i + 1] }
              var y = evaluate(meta, 'fn', { x: x })
              if (!Interval.isEmpty(y) && !Interval.isWhole(y)) {
                samples.push([x, y])
              }
              if (Interval.isWhole(y)) {
                samples.push(null)
              }
            }
            for (i = 1; i < samples.length - 1; i += 1) {
              if (!samples[i]) {
                var prev = samples[i - 1]
                var next = samples[i + 1]
                if (
                  prev &&
                  next &&
                  !Interval.intervalsOverlap(prev[1], next[1])
                ) {
                  if (prev[1].lo > next[1].hi) {
                    prev[1].hi = Math.max(yMax, prev[1].hi)
                    next[1].lo = Math.min(yMin, next[1].lo)
                  }
                  if (prev[1].hi < next[1].lo) {
                    prev[1].lo = Math.min(yMin, prev[1].lo)
                    next[1].hi = Math.max(yMax, next[1].hi)
                  }
                }
              }
            }
            samples.scaledDx = xScale(xCoords[1]) - xScale(xCoords[0])
            return [samples]
          }
          var rectEps
          function smallRect (x, y) {
            return Interval.width(x) < rectEps
          }
          function quadTree (x, y, meta) {
            var sample = evaluate(meta, 'fn', { x: x, y: y })
            var fulfills = Interval.zeroIn(sample)
            if (!fulfills) {
              return this
            }
            if (smallRect(x, y)) {
              this.push([x, y])
              return this
            }
            var midX = x.lo + (x.hi - x.lo) / 2
            var midY = y.lo + (y.hi - y.lo) / 2
            var east = { lo: midX, hi: x.hi }
            var west = { lo: x.lo, hi: midX }
            var north = { lo: midY, hi: y.hi }
            var south = { lo: y.lo, hi: midY }
            quadTree.call(this, east, north, meta)
            quadTree.call(this, east, south, meta)
            quadTree.call(this, west, north, meta)
            quadTree.call(this, west, south, meta)
          }
          function interval2d (chart, meta) {
            var xScale = chart.meta.xScale
            var xDomain = chart.meta.xScale.domain()
            var yDomain = chart.meta.yScale.domain()
            var x = { lo: xDomain[0], hi: xDomain[1] }
            var y = { lo: yDomain[0], hi: yDomain[1] }
            var samples = []
            rectEps = xScale.invert(1) - xScale.invert(0)
            quadTree.call(samples, x, y, meta)
            samples.scaledDx = 1
            return [samples]
          }
          var sampler = function (chart, d, range, nSamples) {
            var fnTypes = { implicit: interval2d, linear: interval1d }
            if (!fnTypes.hasOwnProperty(d.fnType)) {
              throw Error(
                d.fnType + ' is not supported in the `interval` sampler'
              )
            }
            return fnTypes[d.fnType].apply(null, arguments)
          }
          module.exports = sampler
        },
        {
          '../helpers/eval': 11,
          '../utils': 22,
          'interval-arithmetic-eval': 36
        }
      ],
      21: [
        function (require, module, exports) {
          'use strict'
          var d3 = window.d3
          var extend = require('extend')
          var utils = require('./utils')
          var clamp = require('clamp')
          var globals = require('./globals')
          var builtInEvaluator = require('./helpers/eval').builtIn
          module.exports = function (config) {
            config = extend(
              {
                xLine: false,
                yLine: false,
                renderer: function (x, y, index) {
                  return '(' + x.toFixed(3) + ', ' + y.toFixed(3) + ')'
                },
                owner: null
              },
              config
            )
            var MARGIN = 20
            var line = d3.svg
              .line()
              .x(function (d) {
                return d[0]
              })
              .y(function (d) {
                return d[1]
              })
            function lineGenerator (el, data) {
              return el
                .append('path')
                .datum(data)
                .attr('stroke', 'grey')
                .attr('stroke-dasharray', '5,5')
                .attr('opacity', 0.5)
                .attr('d', line)
            }
            function tip (selection) {
              var innerSelection = selection
                .selectAll('g.tip')
                .data(function (d) {
                  return [d]
                })
              innerSelection
                .enter()
                .append('g')
                .attr('class', 'tip')
                .attr(
                  'clip-path',
                  'url(#function-plot-clip-' + config.owner.id + ')'
                )
              tip.el = innerSelection
                .selectAll('g.inner-tip')
                .data(function (d) {
                  return [d]
                })
              tip.el
                .enter()
                .append('g')
                .attr('class', 'inner-tip')
                .style('display', 'none')
                .each(function () {
                  var el = d3.select(this)
                  lineGenerator(el, [
                    [0, -config.owner.meta.height - MARGIN],
                    [0, config.owner.meta.height + MARGIN]
                  ])
                    .attr('class', 'tip-x-line')
                    .style('display', 'none')
                  lineGenerator(el, [
                    [-config.owner.meta.width - MARGIN, 0],
                    [config.owner.meta.width + MARGIN, 0]
                  ])
                    .attr('class', 'tip-y-line')
                    .style('display', 'none')
                  el.append('circle').attr('r', 3)
                  el.append('text').attr('transform', 'translate(5,-5)')
                })
              selection
                .selectAll('.tip-x-line')
                .style('display', config.xLine ? null : 'none')
              selection
                .selectAll('.tip-y-line')
                .style('display', config.yLine ? null : 'none')
            }
            tip.move = function (coordinates) {
              var i
              var minDist = Infinity
              var closestIndex = -1
              var x, y
              var el = tip.el
              var inf = 1e8
              var meta = config.owner.meta
              var data = el.data()[0].data
              var xScale = meta.xScale
              var yScale = meta.yScale
              var width = meta.width
              var height = meta.height
              var x0 = coordinates.x
              var y0 = coordinates.y
              for (i = 0; i < data.length; i += 1) {
                if (data[i].skipTip || data[i].fnType !== 'linear') {
                  continue
                }
                var range = data[i].range || [-inf, inf]
                if (
                  x0 > range[0] - globals.TIP_X_EPS &&
                  x0 < range[1] + globals.TIP_X_EPS
                ) {
                  try {
                    var candidateY = builtInEvaluator(data[i], 'fn', { x: x0 })
                  } catch (e) {}
                  if (utils.isValidNumber(candidateY)) {
                    var tDist = Math.abs(candidateY - y0)
                    if (tDist < minDist) {
                      minDist = tDist
                      closestIndex = i
                    }
                  }
                }
              }
              if (closestIndex !== -1) {
                x = x0
                if (data[closestIndex].range) {
                  x = Math.max(x, data[closestIndex].range[0])
                  x = Math.min(x, data[closestIndex].range[1])
                }
                y = builtInEvaluator(data[closestIndex], 'fn', { x: x })
                tip.show()
                config.owner.emit('tip:update', x, y, closestIndex)
                var clampX = clamp(
                  x,
                  xScale.invert(-MARGIN),
                  xScale.invert(width + MARGIN)
                )
                var clampY = clamp(
                  y,
                  yScale.invert(height + MARGIN),
                  yScale.invert(-MARGIN)
                )
                var color = utils.color(data[closestIndex], closestIndex)
                el.attr(
                  'transform',
                  'translate(' + xScale(clampX) + ',' + yScale(clampY) + ')'
                )
                el.select('circle').attr('fill', color)
                el.select('text')
                  .attr('fill', color)
                  .text(config.renderer(x, y, closestIndex))
              } else {
                tip.hide()
              }
            }
            tip.show = function () {
              this.el.style('display', null)
            }
            tip.hide = function () {
              this.el.style('display', 'none')
            }
            Object.keys(config).forEach(function (option) {
              utils.getterSetter.call(tip, config, option)
            })
            return tip
          }
        },
        {
          './globals': 4,
          './helpers/eval': 11,
          './utils': 22,
          clamp: 29,
          extend: 32
        }
      ],
      22: [
        function (require, module, exports) {
          'use strict'
          var linspace = require('linspace')
          var logspace = require('logspace')
          var log10 = require('log10')
          var globals = require('./globals')
          module.exports = {
            isValidNumber: function (v) {
              return typeof v === 'number' && !isNaN(v)
            },
            space: function (chart, range, n) {
              var lo = range[0]
              var hi = range[1]
              if (chart.options.xAxis.type === 'log') {
                return logspace(log10(lo), log10(hi), n)
              }
              return linspace(lo, hi, n)
            },
            getterSetter: function (config, option) {
              var me = this
              this[option] = function (value) {
                if (!arguments.length) {
                  return config[option]
                }
                config[option] = value
                return me
              }
            },
            sgn: function (v) {
              if (v < 0) {
                return -1
              }
              if (v > 0) {
                return 1
              }
              return 0
            },
            color: function (data, index) {
              return data.color || globals.COLORS[index]
            }
          }
        },
        { './globals': 4, linspace: 56, log10: 57, logspace: 58 }
      ],
      23: [
        function (require, module, exports) {
          'use strict'
          exports.byteLength = byteLength
          exports.toByteArray = toByteArray
          exports.fromByteArray = fromByteArray
          var lookup = []
          var revLookup = []
          var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array
          var code =
            'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
          for (var i = 0, len = code.length; i < len; ++i) {
            lookup[i] = code[i]
            revLookup[code.charCodeAt(i)] = i
          }
          revLookup['-'.charCodeAt(0)] = 62
          revLookup['_'.charCodeAt(0)] = 63
          function placeHoldersCount (b64) {
            var len = b64.length
            if (len % 4 > 0) {
              throw new Error('Invalid string. Length must be a multiple of 4')
            }
            return b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0
          }
          function byteLength (b64) {
            return (b64.length * 3) / 4 - placeHoldersCount(b64)
          }
          function toByteArray (b64) {
            var i, j, l, tmp, placeHolders, arr
            var len = b64.length
            placeHolders = placeHoldersCount(b64)
            arr = new Arr((len * 3) / 4 - placeHolders)
            l = placeHolders > 0 ? len - 4 : len
            var L = 0
            for (i = 0, j = 0; i < l; i += 4, j += 3) {
              tmp =
                (revLookup[b64.charCodeAt(i)] << 18) |
                (revLookup[b64.charCodeAt(i + 1)] << 12) |
                (revLookup[b64.charCodeAt(i + 2)] << 6) |
                revLookup[b64.charCodeAt(i + 3)]
              arr[L++] = (tmp >> 16) & 255
              arr[L++] = (tmp >> 8) & 255
              arr[L++] = tmp & 255
            }
            if (placeHolders === 2) {
              tmp =
                (revLookup[b64.charCodeAt(i)] << 2) |
                (revLookup[b64.charCodeAt(i + 1)] >> 4)
              arr[L++] = tmp & 255
            } else if (placeHolders === 1) {
              tmp =
                (revLookup[b64.charCodeAt(i)] << 10) |
                (revLookup[b64.charCodeAt(i + 1)] << 4) |
                (revLookup[b64.charCodeAt(i + 2)] >> 2)
              arr[L++] = (tmp >> 8) & 255
              arr[L++] = tmp & 255
            }
            return arr
          }
          function tripletToBase64 (num) {
            return (
              lookup[(num >> 18) & 63] +
              lookup[(num >> 12) & 63] +
              lookup[(num >> 6) & 63] +
              lookup[num & 63]
            )
          }
          function encodeChunk (uint8, start, end) {
            var tmp
            var output = []
            for (var i = start; i < end; i += 3) {
              tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + uint8[i + 2]
              output.push(tripletToBase64(tmp))
            }
            return output.join('')
          }
          function fromByteArray (uint8) {
            var tmp
            var len = uint8.length
            var extraBytes = len % 3
            var output = ''
            var parts = []
            var maxChunkLength = 16383
            for (
              var i = 0, len2 = len - extraBytes;
              i < len2;
              i += maxChunkLength
            ) {
              parts.push(
                encodeChunk(
                  uint8,
                  i,
                  i + maxChunkLength > len2 ? len2 : i + maxChunkLength
                )
              )
            }
            if (extraBytes === 1) {
              tmp = uint8[len - 1]
              output += lookup[tmp >> 2]
              output += lookup[(tmp << 4) & 63]
              output += '=='
            } else if (extraBytes === 2) {
              tmp = (uint8[len - 2] << 8) + uint8[len - 1]
              output += lookup[tmp >> 10]
              output += lookup[(tmp >> 4) & 63]
              output += lookup[(tmp << 2) & 63]
              output += '='
            }
            parts.push(output)
            return parts.join('')
          }
        },
        {}
      ],
      24: [
        function (require, module, exports) {
          ;(function (global) {
            'use strict'
            var base64 = require('base64-js')
            var ieee754 = require('ieee754')
            var isArray = require('isarray')
            exports.Buffer = Buffer
            exports.SlowBuffer = SlowBuffer
            exports.INSPECT_MAX_BYTES = 50
            Buffer.TYPED_ARRAY_SUPPORT =
              global.TYPED_ARRAY_SUPPORT !== undefined
                ? global.TYPED_ARRAY_SUPPORT
                : typedArraySupport()
            exports.kMaxLength = kMaxLength()
            function typedArraySupport () {
              try {
                var arr = new Uint8Array(1)
                arr.__proto__ = {
                  __proto__: Uint8Array.prototype,
                  foo: function () {
                    return 42
                  }
                }
                return (
                  arr.foo() === 42 &&
                  typeof arr.subarray === 'function' &&
                  arr.subarray(1, 1).byteLength === 0
                )
              } catch (e) {
                return false
              }
            }
            function kMaxLength () {
              return Buffer.TYPED_ARRAY_SUPPORT ? 2147483647 : 1073741823
            }
            function createBuffer (that, length) {
              if (kMaxLength() < length) {
                throw new RangeError('Invalid typed array length')
              }
              if (Buffer.TYPED_ARRAY_SUPPORT) {
                that = new Uint8Array(length)
                that.__proto__ = Buffer.prototype
              } else {
                if (that === null) {
                  that = new Buffer(length)
                }
                that.length = length
              }
              return that
            }
            function Buffer (arg, encodingOrOffset, length) {
              if (!Buffer.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer)) {
                return new Buffer(arg, encodingOrOffset, length)
              }
              if (typeof arg === 'number') {
                if (typeof encodingOrOffset === 'string') {
                  throw new Error(
                    'If encoding is specified then the first argument must be a string'
                  )
                }
                return allocUnsafe(this, arg)
              }
              return from(this, arg, encodingOrOffset, length)
            }
            Buffer.poolSize = 8192
            Buffer._augment = function (arr) {
              arr.__proto__ = Buffer.prototype
              return arr
            }
            function from (that, value, encodingOrOffset, length) {
              if (typeof value === 'number') {
                throw new TypeError('"value" argument must not be a number')
              }
              if (
                typeof ArrayBuffer !== 'undefined' &&
                value instanceof ArrayBuffer
              ) {
                return fromArrayBuffer(that, value, encodingOrOffset, length)
              }
              if (typeof value === 'string') {
                return fromString(that, value, encodingOrOffset)
              }
              return fromObject(that, value)
            }
            Buffer.from = function (value, encodingOrOffset, length) {
              return from(null, value, encodingOrOffset, length)
            }
            if (Buffer.TYPED_ARRAY_SUPPORT) {
              Buffer.prototype.__proto__ = Uint8Array.prototype
              Buffer.__proto__ = Uint8Array
              if (
                typeof Symbol !== 'undefined' &&
                Symbol.species &&
                Buffer[Symbol.species] === Buffer
              ) {
                Object.defineProperty(Buffer, Symbol.species, {
                  value: null,
                  configurable: true
                })
              }
            }
            function assertSize (size) {
              if (typeof size !== 'number') {
                throw new TypeError('"size" argument must be a number')
              } else if (size < 0) {
                throw new RangeError('"size" argument must not be negative')
              }
            }
            function alloc (that, size, fill, encoding) {
              assertSize(size)
              if (size <= 0) {
                return createBuffer(that, size)
              }
              if (fill !== undefined) {
                return typeof encoding === 'string'
                  ? createBuffer(that, size).fill(fill, encoding)
                  : createBuffer(that, size).fill(fill)
              }
              return createBuffer(that, size)
            }
            Buffer.alloc = function (size, fill, encoding) {
              return alloc(null, size, fill, encoding)
            }
            function allocUnsafe (that, size) {
              assertSize(size)
              that = createBuffer(that, size < 0 ? 0 : checked(size) | 0)
              if (!Buffer.TYPED_ARRAY_SUPPORT) {
                for (var i = 0; i < size; ++i) {
                  that[i] = 0
                }
              }
              return that
            }
            Buffer.allocUnsafe = function (size) {
              return allocUnsafe(null, size)
            }
            Buffer.allocUnsafeSlow = function (size) {
              return allocUnsafe(null, size)
            }
            function fromString (that, string, encoding) {
              if (typeof encoding !== 'string' || encoding === '') {
                encoding = 'utf8'
              }
              if (!Buffer.isEncoding(encoding)) {
                throw new TypeError(
                  '"encoding" must be a valid string encoding'
                )
              }
              var length = byteLength(string, encoding) | 0
              that = createBuffer(that, length)
              var actual = that.write(string, encoding)
              if (actual !== length) {
                that = that.slice(0, actual)
              }
              return that
            }
            function fromArrayLike (that, array) {
              var length = array.length < 0 ? 0 : checked(array.length) | 0
              that = createBuffer(that, length)
              for (var i = 0; i < length; i += 1) {
                that[i] = array[i] & 255
              }
              return that
            }
            function fromArrayBuffer (that, array, byteOffset, length) {
              array.byteLength
              if (byteOffset < 0 || array.byteLength < byteOffset) {
                throw new RangeError("'offset' is out of bounds")
              }
              if (array.byteLength < byteOffset + (length || 0)) {
                throw new RangeError("'length' is out of bounds")
              }
              if (byteOffset === undefined && length === undefined) {
                array = new Uint8Array(array)
              } else if (length === undefined) {
                array = new Uint8Array(array, byteOffset)
              } else {
                array = new Uint8Array(array, byteOffset, length)
              }
              if (Buffer.TYPED_ARRAY_SUPPORT) {
                that = array
                that.__proto__ = Buffer.prototype
              } else {
                that = fromArrayLike(that, array)
              }
              return that
            }
            function fromObject (that, obj) {
              if (Buffer.isBuffer(obj)) {
                var len = checked(obj.length) | 0
                that = createBuffer(that, len)
                if (that.length === 0) {
                  return that
                }
                obj.copy(that, 0, 0, len)
                return that
              }
              if (obj) {
                if (
                  (typeof ArrayBuffer !== 'undefined' &&
                    obj.buffer instanceof ArrayBuffer) ||
                  'length' in obj
                ) {
                  if (typeof obj.length !== 'number' || isnan(obj.length)) {
                    return createBuffer(that, 0)
                  }
                  return fromArrayLike(that, obj)
                }
                if (obj.type === 'Buffer' && isArray(obj.data)) {
                  return fromArrayLike(that, obj.data)
                }
              }
              throw new TypeError(
                'First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.'
              )
            }
            function checked (length) {
              if (length >= kMaxLength()) {
                throw new RangeError(
                  'Attempt to allocate Buffer larger than maximum ' +
                    'size: 0x' +
                    kMaxLength().toString(16) +
                    ' bytes'
                )
              }
              return length | 0
            }
            function SlowBuffer (length) {
              if (+length != length) {
                length = 0
              }
              return Buffer.alloc(+length)
            }
            Buffer.isBuffer = function isBuffer (b) {
              return !!(b != null && b._isBuffer)
            }
            Buffer.compare = function compare (a, b) {
              if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
                throw new TypeError('Arguments must be Buffers')
              }
              if (a === b) return 0
              var x = a.length
              var y = b.length
              for (var i = 0, len = Math.min(x, y); i < len; ++i) {
                if (a[i] !== b[i]) {
                  x = a[i]
                  y = b[i]
                  break
                }
              }
              if (x < y) return -1
              if (y < x) return 1
              return 0
            }
            Buffer.isEncoding = function isEncoding (encoding) {
              switch (String(encoding).toLowerCase()) {
                case 'hex':
                case 'utf8':
                case 'utf-8':
                case 'ascii':
                case 'latin1':
                case 'binary':
                case 'base64':
                case 'ucs2':
                case 'ucs-2':
                case 'utf16le':
                case 'utf-16le':
                  return true
                default:
                  return false
              }
            }
            Buffer.concat = function concat (list, length) {
              if (!isArray(list)) {
                throw new TypeError(
                  '"list" argument must be an Array of Buffers'
                )
              }
              if (list.length === 0) {
                return Buffer.alloc(0)
              }
              var i
              if (length === undefined) {
                length = 0
                for (i = 0; i < list.length; ++i) {
                  length += list[i].length
                }
              }
              var buffer = Buffer.allocUnsafe(length)
              var pos = 0
              for (i = 0; i < list.length; ++i) {
                var buf = list[i]
                if (!Buffer.isBuffer(buf)) {
                  throw new TypeError(
                    '"list" argument must be an Array of Buffers'
                  )
                }
                buf.copy(buffer, pos)
                pos += buf.length
              }
              return buffer
            }
            function byteLength (string, encoding) {
              if (Buffer.isBuffer(string)) {
                return string.length
              }
              if (
                typeof ArrayBuffer !== 'undefined' &&
                typeof ArrayBuffer.isView === 'function' &&
                (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)
              ) {
                return string.byteLength
              }
              if (typeof string !== 'string') {
                string = '' + string
              }
              var len = string.length
              if (len === 0) return 0
              var loweredCase = false
              for (;;) {
                switch (encoding) {
                  case 'ascii':
                  case 'latin1':
                  case 'binary':
                    return len
                  case 'utf8':
                  case 'utf-8':
                  case undefined:
                    return utf8ToBytes(string).length
                  case 'ucs2':
                  case 'ucs-2':
                  case 'utf16le':
                  case 'utf-16le':
                    return len * 2
                  case 'hex':
                    return len >>> 1
                  case 'base64':
                    return base64ToBytes(string).length
                  default:
                    if (loweredCase) return utf8ToBytes(string).length
                    encoding = ('' + encoding).toLowerCase()
                    loweredCase = true
                }
              }
            }
            Buffer.byteLength = byteLength
            function slowToString (encoding, start, end) {
              var loweredCase = false
              if (start === undefined || start < 0) {
                start = 0
              }
              if (start > this.length) {
                return ''
              }
              if (end === undefined || end > this.length) {
                end = this.length
              }
              if (end <= 0) {
                return ''
              }
              end >>>= 0
              start >>>= 0
              if (end <= start) {
                return ''
              }
              if (!encoding) encoding = 'utf8'
              while (true) {
                switch (encoding) {
                  case 'hex':
                    return hexSlice(this, start, end)
                  case 'utf8':
                  case 'utf-8':
                    return utf8Slice(this, start, end)
                  case 'ascii':
                    return asciiSlice(this, start, end)
                  case 'latin1':
                  case 'binary':
                    return latin1Slice(this, start, end)
                  case 'base64':
                    return base64Slice(this, start, end)
                  case 'ucs2':
                  case 'ucs-2':
                  case 'utf16le':
                  case 'utf-16le':
                    return utf16leSlice(this, start, end)
                  default:
                    if (loweredCase)
                      throw new TypeError('Unknown encoding: ' + encoding)
                    encoding = (encoding + '').toLowerCase()
                    loweredCase = true
                }
              }
            }
            Buffer.prototype._isBuffer = true
            function swap (b, n, m) {
              var i = b[n]
              b[n] = b[m]
              b[m] = i
            }
            Buffer.prototype.swap16 = function swap16 () {
              var len = this.length
              if (len % 2 !== 0) {
                throw new RangeError(
                  'Buffer size must be a multiple of 16-bits'
                )
              }
              for (var i = 0; i < len; i += 2) {
                swap(this, i, i + 1)
              }
              return this
            }
            Buffer.prototype.swap32 = function swap32 () {
              var len = this.length
              if (len % 4 !== 0) {
                throw new RangeError(
                  'Buffer size must be a multiple of 32-bits'
                )
              }
              for (var i = 0; i < len; i += 4) {
                swap(this, i, i + 3)
                swap(this, i + 1, i + 2)
              }
              return this
            }
            Buffer.prototype.swap64 = function swap64 () {
              var len = this.length
              if (len % 8 !== 0) {
                throw new RangeError(
                  'Buffer size must be a multiple of 64-bits'
                )
              }
              for (var i = 0; i < len; i += 8) {
                swap(this, i, i + 7)
                swap(this, i + 1, i + 6)
                swap(this, i + 2, i + 5)
                swap(this, i + 3, i + 4)
              }
              return this
            }
            Buffer.prototype.toString = function toString () {
              var length = this.length | 0
              if (length === 0) return ''
              if (arguments.length === 0) return utf8Slice(this, 0, length)
              return slowToString.apply(this, arguments)
            }
            Buffer.prototype.equals = function equals (b) {
              if (!Buffer.isBuffer(b))
                throw new TypeError('Argument must be a Buffer')
              if (this === b) return true
              return Buffer.compare(this, b) === 0
            }
            Buffer.prototype.inspect = function inspect () {
              var str = ''
              var max = exports.INSPECT_MAX_BYTES
              if (this.length > 0) {
                str = this.toString('hex', 0, max)
                  .match(/.{2}/g)
                  .join(' ')
                if (this.length > max) str += ' ... '
              }
              return '<Buffer ' + str + '>'
            }
            Buffer.prototype.compare = function compare (
              target,
              start,
              end,
              thisStart,
              thisEnd
            ) {
              if (!Buffer.isBuffer(target)) {
                throw new TypeError('Argument must be a Buffer')
              }
              if (start === undefined) {
                start = 0
              }
              if (end === undefined) {
                end = target ? target.length : 0
              }
              if (thisStart === undefined) {
                thisStart = 0
              }
              if (thisEnd === undefined) {
                thisEnd = this.length
              }
              if (
                start < 0 ||
                end > target.length ||
                thisStart < 0 ||
                thisEnd > this.length
              ) {
                throw new RangeError('out of range index')
              }
              if (thisStart >= thisEnd && start >= end) {
                return 0
              }
              if (thisStart >= thisEnd) {
                return -1
              }
              if (start >= end) {
                return 1
              }
              start >>>= 0
              end >>>= 0
              thisStart >>>= 0
              thisEnd >>>= 0
              if (this === target) return 0
              var x = thisEnd - thisStart
              var y = end - start
              var len = Math.min(x, y)
              var thisCopy = this.slice(thisStart, thisEnd)
              var targetCopy = target.slice(start, end)
              for (var i = 0; i < len; ++i) {
                if (thisCopy[i] !== targetCopy[i]) {
                  x = thisCopy[i]
                  y = targetCopy[i]
                  break
                }
              }
              if (x < y) return -1
              if (y < x) return 1
              return 0
            }
            function bidirectionalIndexOf (
              buffer,
              val,
              byteOffset,
              encoding,
              dir
            ) {
              if (buffer.length === 0) return -1
              if (typeof byteOffset === 'string') {
                encoding = byteOffset
                byteOffset = 0
              } else if (byteOffset > 2147483647) {
                byteOffset = 2147483647
              } else if (byteOffset < -2147483648) {
                byteOffset = -2147483648
              }
              byteOffset = +byteOffset
              if (isNaN(byteOffset)) {
                byteOffset = dir ? 0 : buffer.length - 1
              }
              if (byteOffset < 0) byteOffset = buffer.length + byteOffset
              if (byteOffset >= buffer.length) {
                if (dir) return -1
                else byteOffset = buffer.length - 1
              } else if (byteOffset < 0) {
                if (dir) byteOffset = 0
                else return -1
              }
              if (typeof val === 'string') {
                val = Buffer.from(val, encoding)
              }
              if (Buffer.isBuffer(val)) {
                if (val.length === 0) {
                  return -1
                }
                return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
              } else if (typeof val === 'number') {
                val = val & 255
                if (
                  Buffer.TYPED_ARRAY_SUPPORT &&
                  typeof Uint8Array.prototype.indexOf === 'function'
                ) {
                  if (dir) {
                    return Uint8Array.prototype.indexOf.call(
                      buffer,
                      val,
                      byteOffset
                    )
                  } else {
                    return Uint8Array.prototype.lastIndexOf.call(
                      buffer,
                      val,
                      byteOffset
                    )
                  }
                }
                return arrayIndexOf(buffer, [val], byteOffset, encoding, dir)
              }
              throw new TypeError('val must be string, number or Buffer')
            }
            function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
              var indexSize = 1
              var arrLength = arr.length
              var valLength = val.length
              if (encoding !== undefined) {
                encoding = String(encoding).toLowerCase()
                if (
                  encoding === 'ucs2' ||
                  encoding === 'ucs-2' ||
                  encoding === 'utf16le' ||
                  encoding === 'utf-16le'
                ) {
                  if (arr.length < 2 || val.length < 2) {
                    return -1
                  }
                  indexSize = 2
                  arrLength /= 2
                  valLength /= 2
                  byteOffset /= 2
                }
              }
              function read (buf, i) {
                if (indexSize === 1) {
                  return buf[i]
                } else {
                  return buf.readUInt16BE(i * indexSize)
                }
              }
              var i
              if (dir) {
                var foundIndex = -1
                for (i = byteOffset; i < arrLength; i++) {
                  if (
                    read(arr, i) ===
                    read(val, foundIndex === -1 ? 0 : i - foundIndex)
                  ) {
                    if (foundIndex === -1) foundIndex = i
                    if (i - foundIndex + 1 === valLength)
                      return foundIndex * indexSize
                  } else {
                    if (foundIndex !== -1) i -= i - foundIndex
                    foundIndex = -1
                  }
                }
              } else {
                if (byteOffset + valLength > arrLength)
                  byteOffset = arrLength - valLength
                for (i = byteOffset; i >= 0; i--) {
                  var found = true
                  for (var j = 0; j < valLength; j++) {
                    if (read(arr, i + j) !== read(val, j)) {
                      found = false
                      break
                    }
                  }
                  if (found) return i
                }
              }
              return -1
            }
            Buffer.prototype.includes = function includes (
              val,
              byteOffset,
              encoding
            ) {
              return this.indexOf(val, byteOffset, encoding) !== -1
            }
            Buffer.prototype.indexOf = function indexOf (
              val,
              byteOffset,
              encoding
            ) {
              return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
            }
            Buffer.prototype.lastIndexOf = function lastIndexOf (
              val,
              byteOffset,
              encoding
            ) {
              return bidirectionalIndexOf(
                this,
                val,
                byteOffset,
                encoding,
                false
              )
            }
            function hexWrite (buf, string, offset, length) {
              offset = Number(offset) || 0
              var remaining = buf.length - offset
              if (!length) {
                length = remaining
              } else {
                length = Number(length)
                if (length > remaining) {
                  length = remaining
                }
              }
              var strLen = string.length
              if (strLen % 2 !== 0) throw new TypeError('Invalid hex string')
              if (length > strLen / 2) {
                length = strLen / 2
              }
              for (var i = 0; i < length; ++i) {
                var parsed = parseInt(string.substr(i * 2, 2), 16)
                if (isNaN(parsed)) return i
                buf[offset + i] = parsed
              }
              return i
            }
            function utf8Write (buf, string, offset, length) {
              return blitBuffer(
                utf8ToBytes(string, buf.length - offset),
                buf,
                offset,
                length
              )
            }
            function asciiWrite (buf, string, offset, length) {
              return blitBuffer(asciiToBytes(string), buf, offset, length)
            }
            function latin1Write (buf, string, offset, length) {
              return asciiWrite(buf, string, offset, length)
            }
            function base64Write (buf, string, offset, length) {
              return blitBuffer(base64ToBytes(string), buf, offset, length)
            }
            function ucs2Write (buf, string, offset, length) {
              return blitBuffer(
                utf16leToBytes(string, buf.length - offset),
                buf,
                offset,
                length
              )
            }
            Buffer.prototype.write = function write (
              string,
              offset,
              length,
              encoding
            ) {
              if (offset === undefined) {
                encoding = 'utf8'
                length = this.length
                offset = 0
              } else if (length === undefined && typeof offset === 'string') {
                encoding = offset
                length = this.length
                offset = 0
              } else if (isFinite(offset)) {
                offset = offset | 0
                if (isFinite(length)) {
                  length = length | 0
                  if (encoding === undefined) encoding = 'utf8'
                } else {
                  encoding = length
                  length = undefined
                }
              } else {
                throw new Error(
                  'Buffer.write(string, encoding, offset[, length]) is no longer supported'
                )
              }
              var remaining = this.length - offset
              if (length === undefined || length > remaining) length = remaining
              if (
                (string.length > 0 && (length < 0 || offset < 0)) ||
                offset > this.length
              ) {
                throw new RangeError('Attempt to write outside buffer bounds')
              }
              if (!encoding) encoding = 'utf8'
              var loweredCase = false
              for (;;) {
                switch (encoding) {
                  case 'hex':
                    return hexWrite(this, string, offset, length)
                  case 'utf8':
                  case 'utf-8':
                    return utf8Write(this, string, offset, length)
                  case 'ascii':
                    return asciiWrite(this, string, offset, length)
                  case 'latin1':
                  case 'binary':
                    return latin1Write(this, string, offset, length)
                  case 'base64':
                    return base64Write(this, string, offset, length)
                  case 'ucs2':
                  case 'ucs-2':
                  case 'utf16le':
                  case 'utf-16le':
                    return ucs2Write(this, string, offset, length)
                  default:
                    if (loweredCase)
                      throw new TypeError('Unknown encoding: ' + encoding)
                    encoding = ('' + encoding).toLowerCase()
                    loweredCase = true
                }
              }
            }
            Buffer.prototype.toJSON = function toJSON () {
              return {
                type: 'Buffer',
                data: Array.prototype.slice.call(this._arr || this, 0)
              }
            }
            function base64Slice (buf, start, end) {
              if (start === 0 && end === buf.length) {
                return base64.fromByteArray(buf)
              } else {
                return base64.fromByteArray(buf.slice(start, end))
              }
            }
            function utf8Slice (buf, start, end) {
              end = Math.min(buf.length, end)
              var res = []
              var i = start
              while (i < end) {
                var firstByte = buf[i]
                var codePoint = null
                var bytesPerSequence =
                  firstByte > 239
                    ? 4
                    : firstByte > 223
                    ? 3
                    : firstByte > 191
                    ? 2
                    : 1
                if (i + bytesPerSequence <= end) {
                  var secondByte, thirdByte, fourthByte, tempCodePoint
                  switch (bytesPerSequence) {
                    case 1:
                      if (firstByte < 128) {
                        codePoint = firstByte
                      }
                      break
                    case 2:
                      secondByte = buf[i + 1]
                      if ((secondByte & 192) === 128) {
                        tempCodePoint =
                          ((firstByte & 31) << 6) | (secondByte & 63)
                        if (tempCodePoint > 127) {
                          codePoint = tempCodePoint
                        }
                      }
                      break
                    case 3:
                      secondByte = buf[i + 1]
                      thirdByte = buf[i + 2]
                      if (
                        (secondByte & 192) === 128 &&
                        (thirdByte & 192) === 128
                      ) {
                        tempCodePoint =
                          ((firstByte & 15) << 12) |
                          ((secondByte & 63) << 6) |
                          (thirdByte & 63)
                        if (
                          tempCodePoint > 2047 &&
                          (tempCodePoint < 55296 || tempCodePoint > 57343)
                        ) {
                          codePoint = tempCodePoint
                        }
                      }
                      break
                    case 4:
                      secondByte = buf[i + 1]
                      thirdByte = buf[i + 2]
                      fourthByte = buf[i + 3]
                      if (
                        (secondByte & 192) === 128 &&
                        (thirdByte & 192) === 128 &&
                        (fourthByte & 192) === 128
                      ) {
                        tempCodePoint =
                          ((firstByte & 15) << 18) |
                          ((secondByte & 63) << 12) |
                          ((thirdByte & 63) << 6) |
                          (fourthByte & 63)
                        if (tempCodePoint > 65535 && tempCodePoint < 1114112) {
                          codePoint = tempCodePoint
                        }
                      }
                  }
                }
                if (codePoint === null) {
                  codePoint = 65533
                  bytesPerSequence = 1
                } else if (codePoint > 65535) {
                  codePoint -= 65536
                  res.push(((codePoint >>> 10) & 1023) | 55296)
                  codePoint = 56320 | (codePoint & 1023)
                }
                res.push(codePoint)
                i += bytesPerSequence
              }
              return decodeCodePointsArray(res)
            }
            var MAX_ARGUMENTS_LENGTH = 4096
            function decodeCodePointsArray (codePoints) {
              var len = codePoints.length
              if (len <= MAX_ARGUMENTS_LENGTH) {
                return String.fromCharCode.apply(String, codePoints)
              }
              var res = ''
              var i = 0
              while (i < len) {
                res += String.fromCharCode.apply(
                  String,
                  codePoints.slice(i, (i += MAX_ARGUMENTS_LENGTH))
                )
              }
              return res
            }
            function asciiSlice (buf, start, end) {
              var ret = ''
              end = Math.min(buf.length, end)
              for (var i = start; i < end; ++i) {
                ret += String.fromCharCode(buf[i] & 127)
              }
              return ret
            }
            function latin1Slice (buf, start, end) {
              var ret = ''
              end = Math.min(buf.length, end)
              for (var i = start; i < end; ++i) {
                ret += String.fromCharCode(buf[i])
              }
              return ret
            }
            function hexSlice (buf, start, end) {
              var len = buf.length
              if (!start || start < 0) start = 0
              if (!end || end < 0 || end > len) end = len
              var out = ''
              for (var i = start; i < end; ++i) {
                out += toHex(buf[i])
              }
              return out
            }
            function utf16leSlice (buf, start, end) {
              var bytes = buf.slice(start, end)
              var res = ''
              for (var i = 0; i < bytes.length; i += 2) {
                res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
              }
              return res
            }
            Buffer.prototype.slice = function slice (start, end) {
              var len = this.length
              start = ~~start
              end = end === undefined ? len : ~~end
              if (start < 0) {
                start += len
                if (start < 0) start = 0
              } else if (start > len) {
                start = len
              }
              if (end < 0) {
                end += len
                if (end < 0) end = 0
              } else if (end > len) {
                end = len
              }
              if (end < start) end = start
              var newBuf
              if (Buffer.TYPED_ARRAY_SUPPORT) {
                newBuf = this.subarray(start, end)
                newBuf.__proto__ = Buffer.prototype
              } else {
                var sliceLen = end - start
                newBuf = new Buffer(sliceLen, undefined)
                for (var i = 0; i < sliceLen; ++i) {
                  newBuf[i] = this[i + start]
                }
              }
              return newBuf
            }
            function checkOffset (offset, ext, length) {
              if (offset % 1 !== 0 || offset < 0)
                throw new RangeError('offset is not uint')
              if (offset + ext > length)
                throw new RangeError('Trying to access beyond buffer length')
            }
            Buffer.prototype.readUIntLE = function readUIntLE (
              offset,
              byteLength,
              noAssert
            ) {
              offset = offset | 0
              byteLength = byteLength | 0
              if (!noAssert) checkOffset(offset, byteLength, this.length)
              var val = this[offset]
              var mul = 1
              var i = 0
              while (++i < byteLength && (mul *= 256)) {
                val += this[offset + i] * mul
              }
              return val
            }
            Buffer.prototype.readUIntBE = function readUIntBE (
              offset,
              byteLength,
              noAssert
            ) {
              offset = offset | 0
              byteLength = byteLength | 0
              if (!noAssert) {
                checkOffset(offset, byteLength, this.length)
              }
              var val = this[offset + --byteLength]
              var mul = 1
              while (byteLength > 0 && (mul *= 256)) {
                val += this[offset + --byteLength] * mul
              }
              return val
            }
            Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
              if (!noAssert) checkOffset(offset, 1, this.length)
              return this[offset]
            }
            Buffer.prototype.readUInt16LE = function readUInt16LE (
              offset,
              noAssert
            ) {
              if (!noAssert) checkOffset(offset, 2, this.length)
              return this[offset] | (this[offset + 1] << 8)
            }
            Buffer.prototype.readUInt16BE = function readUInt16BE (
              offset,
              noAssert
            ) {
              if (!noAssert) checkOffset(offset, 2, this.length)
              return (this[offset] << 8) | this[offset + 1]
            }
            Buffer.prototype.readUInt32LE = function readUInt32LE (
              offset,
              noAssert
            ) {
              if (!noAssert) checkOffset(offset, 4, this.length)
              return (
                (this[offset] |
                  (this[offset + 1] << 8) |
                  (this[offset + 2] << 16)) +
                this[offset + 3] * 16777216
              )
            }
            Buffer.prototype.readUInt32BE = function readUInt32BE (
              offset,
              noAssert
            ) {
              if (!noAssert) checkOffset(offset, 4, this.length)
              return (
                this[offset] * 16777216 +
                ((this[offset + 1] << 16) |
                  (this[offset + 2] << 8) |
                  this[offset + 3])
              )
            }
            Buffer.prototype.readIntLE = function readIntLE (
              offset,
              byteLength,
              noAssert
            ) {
              offset = offset | 0
              byteLength = byteLength | 0
              if (!noAssert) checkOffset(offset, byteLength, this.length)
              var val = this[offset]
              var mul = 1
              var i = 0
              while (++i < byteLength && (mul *= 256)) {
                val += this[offset + i] * mul
              }
              mul *= 128
              if (val >= mul) val -= Math.pow(2, 8 * byteLength)
              return val
            }
            Buffer.prototype.readIntBE = function readIntBE (
              offset,
              byteLength,
              noAssert
            ) {
              offset = offset | 0
              byteLength = byteLength | 0
              if (!noAssert) checkOffset(offset, byteLength, this.length)
              var i = byteLength
              var mul = 1
              var val = this[offset + --i]
              while (i > 0 && (mul *= 256)) {
                val += this[offset + --i] * mul
              }
              mul *= 128
              if (val >= mul) val -= Math.pow(2, 8 * byteLength)
              return val
            }
            Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
              if (!noAssert) checkOffset(offset, 1, this.length)
              if (!(this[offset] & 128)) return this[offset]
              return (255 - this[offset] + 1) * -1
            }
            Buffer.prototype.readInt16LE = function readInt16LE (
              offset,
              noAssert
            ) {
              if (!noAssert) checkOffset(offset, 2, this.length)
              var val = this[offset] | (this[offset + 1] << 8)
              return val & 32768 ? val | 4294901760 : val
            }
            Buffer.prototype.readInt16BE = function readInt16BE (
              offset,
              noAssert
            ) {
              if (!noAssert) checkOffset(offset, 2, this.length)
              var val = this[offset + 1] | (this[offset] << 8)
              return val & 32768 ? val | 4294901760 : val
            }
            Buffer.prototype.readInt32LE = function readInt32LE (
              offset,
              noAssert
            ) {
              if (!noAssert) checkOffset(offset, 4, this.length)
              return (
                this[offset] |
                (this[offset + 1] << 8) |
                (this[offset + 2] << 16) |
                (this[offset + 3] << 24)
              )
            }
            Buffer.prototype.readInt32BE = function readInt32BE (
              offset,
              noAssert
            ) {
              if (!noAssert) checkOffset(offset, 4, this.length)
              return (
                (this[offset] << 24) |
                (this[offset + 1] << 16) |
                (this[offset + 2] << 8) |
                this[offset + 3]
              )
            }
            Buffer.prototype.readFloatLE = function readFloatLE (
              offset,
              noAssert
            ) {
              if (!noAssert) checkOffset(offset, 4, this.length)
              return ieee754.read(this, offset, true, 23, 4)
            }
            Buffer.prototype.readFloatBE = function readFloatBE (
              offset,
              noAssert
            ) {
              if (!noAssert) checkOffset(offset, 4, this.length)
              return ieee754.read(this, offset, false, 23, 4)
            }
            Buffer.prototype.readDoubleLE = function readDoubleLE (
              offset,
              noAssert
            ) {
              if (!noAssert) checkOffset(offset, 8, this.length)
              return ieee754.read(this, offset, true, 52, 8)
            }
            Buffer.prototype.readDoubleBE = function readDoubleBE (
              offset,
              noAssert
            ) {
              if (!noAssert) checkOffset(offset, 8, this.length)
              return ieee754.read(this, offset, false, 52, 8)
            }
            function checkInt (buf, value, offset, ext, max, min) {
              if (!Buffer.isBuffer(buf))
                throw new TypeError(
                  '"buffer" argument must be a Buffer instance'
                )
              if (value > max || value < min)
                throw new RangeError('"value" argument is out of bounds')
              if (offset + ext > buf.length)
                throw new RangeError('Index out of range')
            }
            Buffer.prototype.writeUIntLE = function writeUIntLE (
              value,
              offset,
              byteLength,
              noAssert
            ) {
              value = +value
              offset = offset | 0
              byteLength = byteLength | 0
              if (!noAssert) {
                var maxBytes = Math.pow(2, 8 * byteLength) - 1
                checkInt(this, value, offset, byteLength, maxBytes, 0)
              }
              var mul = 1
              var i = 0
              this[offset] = value & 255
              while (++i < byteLength && (mul *= 256)) {
                this[offset + i] = (value / mul) & 255
              }
              return offset + byteLength
            }
            Buffer.prototype.writeUIntBE = function writeUIntBE (
              value,
              offset,
              byteLength,
              noAssert
            ) {
              value = +value
              offset = offset | 0
              byteLength = byteLength | 0
              if (!noAssert) {
                var maxBytes = Math.pow(2, 8 * byteLength) - 1
                checkInt(this, value, offset, byteLength, maxBytes, 0)
              }
              var i = byteLength - 1
              var mul = 1
              this[offset + i] = value & 255
              while (--i >= 0 && (mul *= 256)) {
                this[offset + i] = (value / mul) & 255
              }
              return offset + byteLength
            }
            Buffer.prototype.writeUInt8 = function writeUInt8 (
              value,
              offset,
              noAssert
            ) {
              value = +value
              offset = offset | 0
              if (!noAssert) checkInt(this, value, offset, 1, 255, 0)
              if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
              this[offset] = value & 255
              return offset + 1
            }
            function objectWriteUInt16 (buf, value, offset, littleEndian) {
              if (value < 0) value = 65535 + value + 1
              for (
                var i = 0, j = Math.min(buf.length - offset, 2);
                i < j;
                ++i
              ) {
                buf[offset + i] =
                  (value & (255 << (8 * (littleEndian ? i : 1 - i)))) >>>
                  ((littleEndian ? i : 1 - i) * 8)
              }
            }
            Buffer.prototype.writeUInt16LE = function writeUInt16LE (
              value,
              offset,
              noAssert
            ) {
              value = +value
              offset = offset | 0
              if (!noAssert) checkInt(this, value, offset, 2, 65535, 0)
              if (Buffer.TYPED_ARRAY_SUPPORT) {
                this[offset] = value & 255
                this[offset + 1] = value >>> 8
              } else {
                objectWriteUInt16(this, value, offset, true)
              }
              return offset + 2
            }
            Buffer.prototype.writeUInt16BE = function writeUInt16BE (
              value,
              offset,
              noAssert
            ) {
              value = +value
              offset = offset | 0
              if (!noAssert) checkInt(this, value, offset, 2, 65535, 0)
              if (Buffer.TYPED_ARRAY_SUPPORT) {
                this[offset] = value >>> 8
                this[offset + 1] = value & 255
              } else {
                objectWriteUInt16(this, value, offset, false)
              }
              return offset + 2
            }
            function objectWriteUInt32 (buf, value, offset, littleEndian) {
              if (value < 0) value = 4294967295 + value + 1
              for (
                var i = 0, j = Math.min(buf.length - offset, 4);
                i < j;
                ++i
              ) {
                buf[offset + i] =
                  (value >>> ((littleEndian ? i : 3 - i) * 8)) & 255
              }
            }
            Buffer.prototype.writeUInt32LE = function writeUInt32LE (
              value,
              offset,
              noAssert
            ) {
              value = +value
              offset = offset | 0
              if (!noAssert) checkInt(this, value, offset, 4, 4294967295, 0)
              if (Buffer.TYPED_ARRAY_SUPPORT) {
                this[offset + 3] = value >>> 24
                this[offset + 2] = value >>> 16
                this[offset + 1] = value >>> 8
                this[offset] = value & 255
              } else {
                objectWriteUInt32(this, value, offset, true)
              }
              return offset + 4
            }
            Buffer.prototype.writeUInt32BE = function writeUInt32BE (
              value,
              offset,
              noAssert
            ) {
              value = +value
              offset = offset | 0
              if (!noAssert) checkInt(this, value, offset, 4, 4294967295, 0)
              if (Buffer.TYPED_ARRAY_SUPPORT) {
                this[offset] = value >>> 24
                this[offset + 1] = value >>> 16
                this[offset + 2] = value >>> 8
                this[offset + 3] = value & 255
              } else {
                objectWriteUInt32(this, value, offset, false)
              }
              return offset + 4
            }
            Buffer.prototype.writeIntLE = function writeIntLE (
              value,
              offset,
              byteLength,
              noAssert
            ) {
              value = +value
              offset = offset | 0
              if (!noAssert) {
                var limit = Math.pow(2, 8 * byteLength - 1)
                checkInt(this, value, offset, byteLength, limit - 1, -limit)
              }
              var i = 0
              var mul = 1
              var sub = 0
              this[offset] = value & 255
              while (++i < byteLength && (mul *= 256)) {
                if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
                  sub = 1
                }
                this[offset + i] = (((value / mul) >> 0) - sub) & 255
              }
              return offset + byteLength
            }
            Buffer.prototype.writeIntBE = function writeIntBE (
              value,
              offset,
              byteLength,
              noAssert
            ) {
              value = +value
              offset = offset | 0
              if (!noAssert) {
                var limit = Math.pow(2, 8 * byteLength - 1)
                checkInt(this, value, offset, byteLength, limit - 1, -limit)
              }
              var i = byteLength - 1
              var mul = 1
              var sub = 0
              this[offset + i] = value & 255
              while (--i >= 0 && (mul *= 256)) {
                if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
                  sub = 1
                }
                this[offset + i] = (((value / mul) >> 0) - sub) & 255
              }
              return offset + byteLength
            }
            Buffer.prototype.writeInt8 = function writeInt8 (
              value,
              offset,
              noAssert
            ) {
              value = +value
              offset = offset | 0
              if (!noAssert) checkInt(this, value, offset, 1, 127, -128)
              if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
              if (value < 0) value = 255 + value + 1
              this[offset] = value & 255
              return offset + 1
            }
            Buffer.prototype.writeInt16LE = function writeInt16LE (
              value,
              offset,
              noAssert
            ) {
              value = +value
              offset = offset | 0
              if (!noAssert) checkInt(this, value, offset, 2, 32767, -32768)
              if (Buffer.TYPED_ARRAY_SUPPORT) {
                this[offset] = value & 255
                this[offset + 1] = value >>> 8
              } else {
                objectWriteUInt16(this, value, offset, true)
              }
              return offset + 2
            }
            Buffer.prototype.writeInt16BE = function writeInt16BE (
              value,
              offset,
              noAssert
            ) {
              value = +value
              offset = offset | 0
              if (!noAssert) checkInt(this, value, offset, 2, 32767, -32768)
              if (Buffer.TYPED_ARRAY_SUPPORT) {
                this[offset] = value >>> 8
                this[offset + 1] = value & 255
              } else {
                objectWriteUInt16(this, value, offset, false)
              }
              return offset + 2
            }
            Buffer.prototype.writeInt32LE = function writeInt32LE (
              value,
              offset,
              noAssert
            ) {
              value = +value
              offset = offset | 0
              if (!noAssert)
                checkInt(this, value, offset, 4, 2147483647, -2147483648)
              if (Buffer.TYPED_ARRAY_SUPPORT) {
                this[offset] = value & 255
                this[offset + 1] = value >>> 8
                this[offset + 2] = value >>> 16
                this[offset + 3] = value >>> 24
              } else {
                objectWriteUInt32(this, value, offset, true)
              }
              return offset + 4
            }
            Buffer.prototype.writeInt32BE = function writeInt32BE (
              value,
              offset,
              noAssert
            ) {
              value = +value
              offset = offset | 0
              if (!noAssert)
                checkInt(this, value, offset, 4, 2147483647, -2147483648)
              if (value < 0) value = 4294967295 + value + 1
              if (Buffer.TYPED_ARRAY_SUPPORT) {
                this[offset] = value >>> 24
                this[offset + 1] = value >>> 16
                this[offset + 2] = value >>> 8
                this[offset + 3] = value & 255
              } else {
                objectWriteUInt32(this, value, offset, false)
              }
              return offset + 4
            }
            function checkIEEE754 (buf, value, offset, ext, max, min) {
              if (offset + ext > buf.length)
                throw new RangeError('Index out of range')
              if (offset < 0) throw new RangeError('Index out of range')
            }
            function writeFloat (buf, value, offset, littleEndian, noAssert) {
              if (!noAssert) {
                checkIEEE754(
                  buf,
                  value,
                  offset,
                  4,
                  3.4028234663852886e38,
                  -3.4028234663852886e38
                )
              }
              ieee754.write(buf, value, offset, littleEndian, 23, 4)
              return offset + 4
            }
            Buffer.prototype.writeFloatLE = function writeFloatLE (
              value,
              offset,
              noAssert
            ) {
              return writeFloat(this, value, offset, true, noAssert)
            }
            Buffer.prototype.writeFloatBE = function writeFloatBE (
              value,
              offset,
              noAssert
            ) {
              return writeFloat(this, value, offset, false, noAssert)
            }
            function writeDouble (buf, value, offset, littleEndian, noAssert) {
              if (!noAssert) {
                checkIEEE754(
                  buf,
                  value,
                  offset,
                  8,
                  1.7976931348623157e308,
                  -1.7976931348623157e308
                )
              }
              ieee754.write(buf, value, offset, littleEndian, 52, 8)
              return offset + 8
            }
            Buffer.prototype.writeDoubleLE = function writeDoubleLE (
              value,
              offset,
              noAssert
            ) {
              return writeDouble(this, value, offset, true, noAssert)
            }
            Buffer.prototype.writeDoubleBE = function writeDoubleBE (
              value,
              offset,
              noAssert
            ) {
              return writeDouble(this, value, offset, false, noAssert)
            }
            Buffer.prototype.copy = function copy (
              target,
              targetStart,
              start,
              end
            ) {
              if (!start) start = 0
              if (!end && end !== 0) end = this.length
              if (targetStart >= target.length) targetStart = target.length
              if (!targetStart) targetStart = 0
              if (end > 0 && end < start) end = start
              if (end === start) return 0
              if (target.length === 0 || this.length === 0) return 0
              if (targetStart < 0) {
                throw new RangeError('targetStart out of bounds')
              }
              if (start < 0 || start >= this.length)
                throw new RangeError('sourceStart out of bounds')
              if (end < 0) throw new RangeError('sourceEnd out of bounds')
              if (end > this.length) end = this.length
              if (target.length - targetStart < end - start) {
                end = target.length - targetStart + start
              }
              var len = end - start
              var i
              if (this === target && start < targetStart && targetStart < end) {
                for (i = len - 1; i >= 0; --i) {
                  target[i + targetStart] = this[i + start]
                }
              } else if (len < 1e3 || !Buffer.TYPED_ARRAY_SUPPORT) {
                for (i = 0; i < len; ++i) {
                  target[i + targetStart] = this[i + start]
                }
              } else {
                Uint8Array.prototype.set.call(
                  target,
                  this.subarray(start, start + len),
                  targetStart
                )
              }
              return len
            }
            Buffer.prototype.fill = function fill (val, start, end, encoding) {
              if (typeof val === 'string') {
                if (typeof start === 'string') {
                  encoding = start
                  start = 0
                  end = this.length
                } else if (typeof end === 'string') {
                  encoding = end
                  end = this.length
                }
                if (val.length === 1) {
                  var code = val.charCodeAt(0)
                  if (code < 256) {
                    val = code
                  }
                }
                if (encoding !== undefined && typeof encoding !== 'string') {
                  throw new TypeError('encoding must be a string')
                }
                if (
                  typeof encoding === 'string' &&
                  !Buffer.isEncoding(encoding)
                ) {
                  throw new TypeError('Unknown encoding: ' + encoding)
                }
              } else if (typeof val === 'number') {
                val = val & 255
              }
              if (start < 0 || this.length < start || this.length < end) {
                throw new RangeError('Out of range index')
              }
              if (end <= start) {
                return this
              }
              start = start >>> 0
              end = end === undefined ? this.length : end >>> 0
              if (!val) val = 0
              var i
              if (typeof val === 'number') {
                for (i = start; i < end; ++i) {
                  this[i] = val
                }
              } else {
                var bytes = Buffer.isBuffer(val)
                  ? val
                  : utf8ToBytes(new Buffer(val, encoding).toString())
                var len = bytes.length
                for (i = 0; i < end - start; ++i) {
                  this[i + start] = bytes[i % len]
                }
              }
              return this
            }
            var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g
            function base64clean (str) {
              str = stringtrim(str).replace(INVALID_BASE64_RE, '')
              if (str.length < 2) return ''
              while (str.length % 4 !== 0) {
                str = str + '='
              }
              return str
            }
            function stringtrim (str) {
              if (str.trim) return str.trim()
              return str.replace(/^\s+|\s+$/g, '')
            }
            function toHex (n) {
              if (n < 16) return '0' + n.toString(16)
              return n.toString(16)
            }
            function utf8ToBytes (string, units) {
              units = units || Infinity
              var codePoint
              var length = string.length
              var leadSurrogate = null
              var bytes = []
              for (var i = 0; i < length; ++i) {
                codePoint = string.charCodeAt(i)
                if (codePoint > 55295 && codePoint < 57344) {
                  if (!leadSurrogate) {
                    if (codePoint > 56319) {
                      if ((units -= 3) > -1) bytes.push(239, 191, 189)
                      continue
                    } else if (i + 1 === length) {
                      if ((units -= 3) > -1) bytes.push(239, 191, 189)
                      continue
                    }
                    leadSurrogate = codePoint
                    continue
                  }
                  if (codePoint < 56320) {
                    if ((units -= 3) > -1) bytes.push(239, 191, 189)
                    leadSurrogate = codePoint
                    continue
                  }
                  codePoint =
                    (((leadSurrogate - 55296) << 10) | (codePoint - 56320)) +
                    65536
                } else if (leadSurrogate) {
                  if ((units -= 3) > -1) bytes.push(239, 191, 189)
                }
                leadSurrogate = null
                if (codePoint < 128) {
                  if ((units -= 1) < 0) break
                  bytes.push(codePoint)
                } else if (codePoint < 2048) {
                  if ((units -= 2) < 0) break
                  bytes.push((codePoint >> 6) | 192, (codePoint & 63) | 128)
                } else if (codePoint < 65536) {
                  if ((units -= 3) < 0) break
                  bytes.push(
                    (codePoint >> 12) | 224,
                    ((codePoint >> 6) & 63) | 128,
                    (codePoint & 63) | 128
                  )
                } else if (codePoint < 1114112) {
                  if ((units -= 4) < 0) break
                  bytes.push(
                    (codePoint >> 18) | 240,
                    ((codePoint >> 12) & 63) | 128,
                    ((codePoint >> 6) & 63) | 128,
                    (codePoint & 63) | 128
                  )
                } else {
                  throw new Error('Invalid code point')
                }
              }
              return bytes
            }
            function asciiToBytes (str) {
              var byteArray = []
              for (var i = 0; i < str.length; ++i) {
                byteArray.push(str.charCodeAt(i) & 255)
              }
              return byteArray
            }
            function utf16leToBytes (str, units) {
              var c, hi, lo
              var byteArray = []
              for (var i = 0; i < str.length; ++i) {
                if ((units -= 2) < 0) break
                c = str.charCodeAt(i)
                hi = c >> 8
                lo = c % 256
                byteArray.push(lo)
                byteArray.push(hi)
              }
              return byteArray
            }
            function base64ToBytes (str) {
              return base64.toByteArray(base64clean(str))
            }
            function blitBuffer (src, dst, offset, length) {
              for (var i = 0; i < length; ++i) {
                if (i + offset >= dst.length || i >= src.length) break
                dst[i + offset] = src[i]
              }
              return i
            }
            function isnan (val) {
              return val !== val
            }
          }.call(
            this,
            typeof global !== 'undefined'
              ? global
              : typeof self !== 'undefined'
              ? self
              : typeof window !== 'undefined'
              ? window
              : {}
          ))
        },
        { 'base64-js': 23, ieee754: 33, isarray: 25 }
      ],
      25: [
        function (require, module, exports) {
          var toString = {}.toString
          module.exports =
            Array.isArray ||
            function (arr) {
              return toString.call(arr) == '[object Array]'
            }
        },
        {}
      ],
      26: [
        function (require, module, exports) {
          'use strict'
          module.exports = require('./lib/eval')
        },
        { './lib/eval': 28 }
      ],
      27: [
        function (require, module, exports) {
          'use strict'
          module.exports = function () {
            var math = Object.create(Math)
            math.factory = function (a) {
              if (typeof a !== 'number') {
                throw new TypeError(
                  'built-in math factory only accepts numbers'
                )
              }
              return Number(a)
            }
            math.add = function (a, b) {
              return a + b
            }
            math.sub = function (a, b) {
              return a - b
            }
            math.mul = function (a, b) {
              return a * b
            }
            math.div = function (a, b) {
              return a / b
            }
            math.mod = function (a, b) {
              return a % b
            }
            math.factorial = function (a) {
              var res = 1
              for (var i = 2; i <= a; i += 1) {
                res *= i
              }
              return res
            }
            math.nthRoot = function (a, root) {
              var inv = root < 0
              if (inv) {
                root = -root
              }
              if (root === 0) {
                throw new Error('Root must be non-zero')
              }
              if (a < 0 && Math.abs(root) % 2 !== 1) {
                throw new Error('Root must be odd when a is negative.')
              }
              if (a === 0) {
                return 0
              }
              if (!isFinite(a)) {
                return inv ? 0 : a
              }
              var x = Math.pow(Math.abs(a), 1 / root)
              x = a < 0 ? -x : x
              return inv ? 1 / x : x
            }
            math.logicalOR = function (a, b) {
              return a || b
            }
            math.logicalXOR = function (a, b) {
              return a != b
            }
            math.logicalAND = function (a, b) {
              return a && b
            }
            math.bitwiseOR = function (a, b) {
              return a | b
            }
            math.bitwiseXOR = function (a, b) {
              return a ^ b
            }
            math.bitwiseAND = function (a, b) {
              return a & b
            }
            math.lessThan = function (a, b) {
              return a < b
            }
            math.lessEqualThan = function (a, b) {
              return a <= b
            }
            math.greaterThan = function (a, b) {
              return a > b
            }
            math.greaterEqualThan = function (a, b) {
              return a >= b
            }
            math.equal = function (a, b) {
              return a == b
            }
            math.strictlyEqual = function (a, b) {
              return a === b
            }
            math.notEqual = function (a, b) {
              return a != b
            }
            math.strictlyNotEqual = function (a, b) {
              return a !== b
            }
            math.shiftRight = function (a, b) {
              return a >> b
            }
            math.shiftLeft = function (a, b) {
              return a << b
            }
            math.unsignedRightShift = function (a, b) {
              return a >>> b
            }
            math.negative = function (a) {
              return -a
            }
            math.positive = function (a) {
              return a
            }
            return math
          }
        },
        {}
      ],
      28: [
        function (require, module, exports) {
          'use strict'
          var CodeGenerator = require('math-codegen')
          var math = require('./adapter')()
          function processScope (scope) {
            Object.keys(scope).forEach(function (k) {
              var value = scope[k]
              scope[k] = math.factory(value)
            })
          }
          module.exports = function (expression) {
            return new CodeGenerator()
              .setDefs({ $$processScope: processScope })
              .parse(expression)
              .compile(math)
          }
          module.exports.math = math
        },
        { './adapter': 27, 'math-codegen': 59 }
      ],
      29: [
        function (require, module, exports) {
          module.exports = clamp
          function clamp (value, min, max) {
            return min < max
              ? value < min
                ? min
                : value > max
                ? max
                : value
              : value < max
              ? max
              : value > min
              ? min
              : value
          }
        },
        {}
      ],
      30: [
        function (require, module, exports) {
          ;(function (Buffer) {
            var hasTypedArrays = false
            if (typeof Float64Array !== 'undefined') {
              var DOUBLE_VIEW = new Float64Array(1),
                UINT_VIEW = new Uint32Array(DOUBLE_VIEW.buffer)
              DOUBLE_VIEW[0] = 1
              hasTypedArrays = true
              if (UINT_VIEW[1] === 1072693248) {
                module.exports = function doubleBitsLE (n) {
                  DOUBLE_VIEW[0] = n
                  return [UINT_VIEW[0], UINT_VIEW[1]]
                }
                function toDoubleLE (lo, hi) {
                  UINT_VIEW[0] = lo
                  UINT_VIEW[1] = hi
                  return DOUBLE_VIEW[0]
                }
                module.exports.pack = toDoubleLE
                function lowUintLE (n) {
                  DOUBLE_VIEW[0] = n
                  return UINT_VIEW[0]
                }
                module.exports.lo = lowUintLE
                function highUintLE (n) {
                  DOUBLE_VIEW[0] = n
                  return UINT_VIEW[1]
                }
                module.exports.hi = highUintLE
              } else if (UINT_VIEW[0] === 1072693248) {
                module.exports = function doubleBitsBE (n) {
                  DOUBLE_VIEW[0] = n
                  return [UINT_VIEW[1], UINT_VIEW[0]]
                }
                function toDoubleBE (lo, hi) {
                  UINT_VIEW[1] = lo
                  UINT_VIEW[0] = hi
                  return DOUBLE_VIEW[0]
                }
                module.exports.pack = toDoubleBE
                function lowUintBE (n) {
                  DOUBLE_VIEW[0] = n
                  return UINT_VIEW[1]
                }
                module.exports.lo = lowUintBE
                function highUintBE (n) {
                  DOUBLE_VIEW[0] = n
                  return UINT_VIEW[0]
                }
                module.exports.hi = highUintBE
              } else {
                hasTypedArrays = false
              }
            }
            if (!hasTypedArrays) {
              var buffer = new Buffer(8)
              module.exports = function doubleBits (n) {
                buffer.writeDoubleLE(n, 0, true)
                return [
                  buffer.readUInt32LE(0, true),
                  buffer.readUInt32LE(4, true)
                ]
              }
              function toDouble (lo, hi) {
                buffer.writeUInt32LE(lo, 0, true)
                buffer.writeUInt32LE(hi, 4, true)
                return buffer.readDoubleLE(0, true)
              }
              module.exports.pack = toDouble
              function lowUint (n) {
                buffer.writeDoubleLE(n, 0, true)
                return buffer.readUInt32LE(0, true)
              }
              module.exports.lo = lowUint
              function highUint (n) {
                buffer.writeDoubleLE(n, 0, true)
                return buffer.readUInt32LE(4, true)
              }
              module.exports.hi = highUint
            }
            module.exports.sign = function (n) {
              return module.exports.hi(n) >>> 31
            }
            module.exports.exponent = function (n) {
              var b = module.exports.hi(n)
              return ((b << 1) >>> 21) - 1023
            }
            module.exports.fraction = function (n) {
              var lo = module.exports.lo(n)
              var hi = module.exports.hi(n)
              var b = hi & ((1 << 20) - 1)
              if (hi & 2146435072) {
                b += 1 << 20
              }
              return [lo, b]
            }
            module.exports.denormalized = function (n) {
              var hi = module.exports.hi(n)
              return !(hi & 2146435072)
            }
          }.call(this, require('buffer').Buffer))
        },
        { buffer: 24 }
      ],
      31: [
        function (require, module, exports) {
          function EventEmitter () {
            this._events = this._events || {}
            this._maxListeners = this._maxListeners || undefined
          }
          module.exports = EventEmitter
          EventEmitter.EventEmitter = EventEmitter
          EventEmitter.prototype._events = undefined
          EventEmitter.prototype._maxListeners = undefined
          EventEmitter.defaultMaxListeners = 10
          EventEmitter.prototype.setMaxListeners = function (n) {
            if (!isNumber(n) || n < 0 || isNaN(n))
              throw TypeError('n must be a positive number')
            this._maxListeners = n
            return this
          }
          EventEmitter.prototype.emit = function (type) {
            var er, handler, len, args, i, listeners
            if (!this._events) this._events = {}
            if (type === 'error') {
              if (
                !this._events.error ||
                (isObject(this._events.error) && !this._events.error.length)
              ) {
                er = arguments[1]
                if (er instanceof Error) {
                  throw er
                } else {
                  var err = new Error(
                    'Uncaught, unspecified "error" event. (' + er + ')'
                  )
                  err.context = er
                  throw err
                }
              }
            }
            handler = this._events[type]
            if (isUndefined(handler)) return false
            if (isFunction(handler)) {
              switch (arguments.length) {
                case 1:
                  handler.call(this)
                  break
                case 2:
                  handler.call(this, arguments[1])
                  break
                case 3:
                  handler.call(this, arguments[1], arguments[2])
                  break
                default:
                  args = Array.prototype.slice.call(arguments, 1)
                  handler.apply(this, args)
              }
            } else if (isObject(handler)) {
              args = Array.prototype.slice.call(arguments, 1)
              listeners = handler.slice()
              len = listeners.length
              for (i = 0; i < len; i++) listeners[i].apply(this, args)
            }
            return true
          }
          EventEmitter.prototype.addListener = function (type, listener) {
            var m
            if (!isFunction(listener))
              throw TypeError('listener must be a function')
            if (!this._events) this._events = {}
            if (this._events.newListener)
              this.emit(
                'newListener',
                type,
                isFunction(listener.listener) ? listener.listener : listener
              )
            if (!this._events[type]) this._events[type] = listener
            else if (isObject(this._events[type]))
              this._events[type].push(listener)
            else this._events[type] = [this._events[type], listener]
            if (isObject(this._events[type]) && !this._events[type].warned) {
              if (!isUndefined(this._maxListeners)) {
                m = this._maxListeners
              } else {
                m = EventEmitter.defaultMaxListeners
              }
              if (m && m > 0 && this._events[type].length > m) {
                this._events[type].warned = true
                console.error(
                  '(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                  this._events[type].length
                )
                if (typeof console.trace === 'function') {
                  console.trace()
                }
              }
            }
            return this
          }
          EventEmitter.prototype.on = EventEmitter.prototype.addListener
          EventEmitter.prototype.once = function (type, listener) {
            if (!isFunction(listener))
              throw TypeError('listener must be a function')
            var fired = false
            function g () {
              this.removeListener(type, g)
              if (!fired) {
                fired = true
                listener.apply(this, arguments)
              }
            }
            g.listener = listener
            this.on(type, g)
            return this
          }
          EventEmitter.prototype.removeListener = function (type, listener) {
            var list, position, length, i
            if (!isFunction(listener))
              throw TypeError('listener must be a function')
            if (!this._events || !this._events[type]) return this
            list = this._events[type]
            length = list.length
            position = -1
            if (
              list === listener ||
              (isFunction(list.listener) && list.listener === listener)
            ) {
              delete this._events[type]
              if (this._events.removeListener)
                this.emit('removeListener', type, listener)
            } else if (isObject(list)) {
              for (i = length; i-- > 0; ) {
                if (
                  list[i] === listener ||
                  (list[i].listener && list[i].listener === listener)
                ) {
                  position = i
                  break
                }
              }
              if (position < 0) return this
              if (list.length === 1) {
                list.length = 0
                delete this._events[type]
              } else {
                list.splice(position, 1)
              }
              if (this._events.removeListener)
                this.emit('removeListener', type, listener)
            }
            return this
          }
          EventEmitter.prototype.removeAllListeners = function (type) {
            var key, listeners
            if (!this._events) return this
            if (!this._events.removeListener) {
              if (arguments.length === 0) this._events = {}
              else if (this._events[type]) delete this._events[type]
              return this
            }
            if (arguments.length === 0) {
              for (key in this._events) {
                if (key === 'removeListener') continue
                this.removeAllListeners(key)
              }
              this.removeAllListeners('removeListener')
              this._events = {}
              return this
            }
            listeners = this._events[type]
            if (isFunction(listeners)) {
              this.removeListener(type, listeners)
            } else if (listeners) {
              while (listeners.length)
                this.removeListener(type, listeners[listeners.length - 1])
            }
            delete this._events[type]
            return this
          }
          EventEmitter.prototype.listeners = function (type) {
            var ret
            if (!this._events || !this._events[type]) ret = []
            else if (isFunction(this._events[type])) ret = [this._events[type]]
            else ret = this._events[type].slice()
            return ret
          }
          EventEmitter.prototype.listenerCount = function (type) {
            if (this._events) {
              var evlistener = this._events[type]
              if (isFunction(evlistener)) return 1
              else if (evlistener) return evlistener.length
            }
            return 0
          }
          EventEmitter.listenerCount = function (emitter, type) {
            return emitter.listenerCount(type)
          }
          function isFunction (arg) {
            return typeof arg === 'function'
          }
          function isNumber (arg) {
            return typeof arg === 'number'
          }
          function isObject (arg) {
            return typeof arg === 'object' && arg !== null
          }
          function isUndefined (arg) {
            return arg === void 0
          }
        },
        {}
      ],
      32: [
        function (require, module, exports) {
          'use strict'
          var hasOwn = Object.prototype.hasOwnProperty
          var toStr = Object.prototype.toString
          var isArray = function isArray (arr) {
            if (typeof Array.isArray === 'function') {
              return Array.isArray(arr)
            }
            return toStr.call(arr) === '[object Array]'
          }
          var isPlainObject = function isPlainObject (obj) {
            if (!obj || toStr.call(obj) !== '[object Object]') {
              return false
            }
            var hasOwnConstructor = hasOwn.call(obj, 'constructor')
            var hasIsPrototypeOf =
              obj.constructor &&
              obj.constructor.prototype &&
              hasOwn.call(obj.constructor.prototype, 'isPrototypeOf')
            if (obj.constructor && !hasOwnConstructor && !hasIsPrototypeOf) {
              return false
            }
            var key
            for (key in obj) {
            }
            return typeof key === 'undefined' || hasOwn.call(obj, key)
          }
          module.exports = function extend () {
            var options,
              name,
              src,
              copy,
              copyIsArray,
              clone,
              target = arguments[0],
              i = 1,
              length = arguments.length,
              deep = false
            if (typeof target === 'boolean') {
              deep = target
              target = arguments[1] || {}
              i = 2
            } else if (
              (typeof target !== 'object' && typeof target !== 'function') ||
              target == null
            ) {
              target = {}
            }
            for (; i < length; ++i) {
              options = arguments[i]
              if (options != null) {
                for (name in options) {
                  src = target[name]
                  copy = options[name]
                  if (target !== copy) {
                    if (
                      deep &&
                      copy &&
                      (isPlainObject(copy) || (copyIsArray = isArray(copy)))
                    ) {
                      if (copyIsArray) {
                        copyIsArray = false
                        clone = src && isArray(src) ? src : []
                      } else {
                        clone = src && isPlainObject(src) ? src : {}
                      }
                      target[name] = extend(deep, clone, copy)
                    } else if (typeof copy !== 'undefined') {
                      target[name] = copy
                    }
                  }
                }
              }
            }
            return target
          }
        },
        {}
      ],
      33: [
        function (require, module, exports) {
          exports.read = function (buffer, offset, isLE, mLen, nBytes) {
            var e, m
            var eLen = nBytes * 8 - mLen - 1
            var eMax = (1 << eLen) - 1
            var eBias = eMax >> 1
            var nBits = -7
            var i = isLE ? nBytes - 1 : 0
            var d = isLE ? -1 : 1
            var s = buffer[offset + i]
            i += d
            e = s & ((1 << -nBits) - 1)
            s >>= -nBits
            nBits += eLen
            for (
              ;
              nBits > 0;
              e = e * 256 + buffer[offset + i], i += d, nBits -= 8
            ) {}
            m = e & ((1 << -nBits) - 1)
            e >>= -nBits
            nBits += mLen
            for (
              ;
              nBits > 0;
              m = m * 256 + buffer[offset + i], i += d, nBits -= 8
            ) {}
            if (e === 0) {
              e = 1 - eBias
            } else if (e === eMax) {
              return m ? NaN : (s ? -1 : 1) * Infinity
            } else {
              m = m + Math.pow(2, mLen)
              e = e - eBias
            }
            return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
          }
          exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
            var e, m, c
            var eLen = nBytes * 8 - mLen - 1
            var eMax = (1 << eLen) - 1
            var eBias = eMax >> 1
            var rt = mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0
            var i = isLE ? 0 : nBytes - 1
            var d = isLE ? 1 : -1
            var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0
            value = Math.abs(value)
            if (isNaN(value) || value === Infinity) {
              m = isNaN(value) ? 1 : 0
              e = eMax
            } else {
              e = Math.floor(Math.log(value) / Math.LN2)
              if (value * (c = Math.pow(2, -e)) < 1) {
                e--
                c *= 2
              }
              if (e + eBias >= 1) {
                value += rt / c
              } else {
                value += rt * Math.pow(2, 1 - eBias)
              }
              if (value * c >= 2) {
                e++
                c /= 2
              }
              if (e + eBias >= eMax) {
                m = 0
                e = eMax
              } else if (e + eBias >= 1) {
                m = (value * c - 1) * Math.pow(2, mLen)
                e = e + eBias
              } else {
                m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
                e = 0
              }
            }
            for (
              ;
              mLen >= 8;
              buffer[offset + i] = m & 255, i += d, m /= 256, mLen -= 8
            ) {}
            e = (e << mLen) | m
            eLen += mLen
            for (
              ;
              eLen > 0;
              buffer[offset + i] = e & 255, i += d, e /= 256, eLen -= 8
            ) {}
            buffer[offset + i - d] |= s * 128
          }
        },
        {}
      ],
      34: [
        function (require, module, exports) {
          module.exports = function () {
            var from = 0,
              to = 0,
              every = 1,
              output = []
            switch (arguments.length) {
              case 1:
                to = arguments[0]
                break
              case 3:
                every = arguments[2]
              case 2:
                from = arguments[0]
                to = arguments[1]
                break
            }
            for (i = from; i < to; i += every) {
              output.push(i)
            }
            return output
          }
        },
        {}
      ],
      35: [
        function (require, module, exports) {
          'use strict'
          module.exports = integrate
          function adsimp (
            f,
            a,
            b,
            fa,
            fm,
            fb,
            V0,
            tol,
            maxdepth,
            depth,
            state
          ) {
            if (state.nanEncountered) {
              return NaN
            }
            var h, f1, f2, sl, sr, s2, m, V1, V2, err
            h = b - a
            f1 = f(a + h * 0.25)
            f2 = f(b - h * 0.25)
            if (isNaN(f1)) {
              state.nanEncountered = true
              return
            }
            if (isNaN(f2)) {
              state.nanEncountered = true
              return
            }
            sl = (h * (fa + 4 * f1 + fm)) / 12
            sr = (h * (fm + 4 * f2 + fb)) / 12
            s2 = sl + sr
            err = (s2 - V0) / 15
            if (depth > maxdepth) {
              state.maxDepthCount++
              return s2 + err
            } else if (Math.abs(err) < tol) {
              return s2 + err
            } else {
              m = a + h * 0.5
              V1 = adsimp(
                f,
                a,
                m,
                fa,
                f1,
                fm,
                sl,
                tol * 0.5,
                maxdepth,
                depth + 1,
                state
              )
              if (isNaN(V1)) {
                state.nanEncountered = true
                return NaN
              }
              V2 = adsimp(
                f,
                m,
                b,
                fm,
                f2,
                fb,
                sr,
                tol * 0.5,
                maxdepth,
                depth + 1,
                state
              )
              if (isNaN(V2)) {
                state.nanEncountered = true
                return NaN
              }
              return V1 + V2
            }
          }
          function integrate (f, a, b, tol, maxdepth) {
            var state = { maxDepthCount: 0, nanEncountered: false }
            if (tol === undefined) {
              tol = 1e-8
            }
            if (maxdepth === undefined) {
              maxdepth = 20
            }
            var fa = f(a)
            var fm = f(0.5 * (a + b))
            var fb = f(b)
            var V0 = ((fa + 4 * fm + fb) * (b - a)) / 6
            var result = adsimp(
              f,
              a,
              b,
              fa,
              fm,
              fb,
              V0,
              tol,
              maxdepth,
              1,
              state
            )
            if (state.maxDepthCount > 0 && console && console.warn) {
              console.warn(
                'integrate-adaptive-simpson: Warning: maximum recursion depth (' +
                  maxdepth +
                  ') reached ' +
                  state.maxDepthCount +
                  ' times'
              )
            }
            if (state.nanEncountered && console && console.warn) {
              console.warn(
                'integrate-adaptive-simpson: Warning: NaN encountered. Halting early.'
              )
            }
            return result
          }
        },
        {}
      ],
      36: [
        function (require, module, exports) {
          'use strict'
          module.exports = require('./lib/eval')
        },
        { './lib/eval': 38 }
      ],
      37: [
        function (require, module, exports) {
          'use strict'
          module.exports = function (ns) {
            ns.mod = ns.fmod
            ns.lessThan = ns.lt
            ns.lessEqualThan = ns.leq
            ns.greaterThan = ns.gt
            ns.greaterEqualThan = ns.geq
            ns.strictlyEqual = ns.equal
            ns.strictlyNotEqual = ns.notEqual
            ns.logicalAND = function (a, b) {
              return a && b
            }
            ns.logicalXOR = function (a, b) {
              return a ^ b
            }
            ns.logicalOR = function (a, b) {
              return a || b
            }
          }
        },
        {}
      ],
      38: [
        function (require, module, exports) {
          'use strict'
          var CodeGenerator = require('math-codegen')
          var Interval = require('interval-arithmetic')
          require('./adapter')(Interval)
          function processScope (scope) {
            Object.keys(scope).forEach(function (k) {
              var value = scope[k]
              if (typeof value === 'number' || Array.isArray(value)) {
                scope[k] = Interval.factory(value)
              } else if (
                typeof value === 'object' &&
                'lo' in value &&
                'hi' in value
              ) {
                scope[k] = Interval.factory(value.lo, value.hi)
              }
            })
          }
          module.exports = function (expression) {
            return new CodeGenerator()
              .setDefs({ $$processScope: processScope })
              .parse(expression)
              .compile(Interval)
          }
          module.exports.policies = require('./policies')(Interval)
          module.exports.Interval = Interval
        },
        {
          './adapter': 37,
          './policies': 39,
          'interval-arithmetic': 40,
          'math-codegen': 59
        }
      ],
      39: [
        function (require, module, exports) {
          'use strict'
          module.exports = function (Interval) {
            return {
              disableRounding: function () {
                Interval.rmath.disable()
              },
              enableRounding: function () {
                Interval.rmath.enable()
              }
            }
          }
        },
        {}
      ],
      40: [
        function (require, module, exports) {
          'use strict'
          var extend = require('xtend/mutable')
          require('./lib/polyfill')
          module.exports = require('./lib/interval')
          module.exports.rmath = require('./lib/round-math')
          module.exports.round = require('./lib/round-math')
          extend(
            module.exports,
            require('./lib/constants'),
            require('./lib/operations/relational'),
            require('./lib/operations/arithmetic'),
            require('./lib/operations/algebra'),
            require('./lib/operations/trigonometric'),
            require('./lib/operations/misc'),
            require('./lib/operations/utils')
          )
        },
        {
          './lib/constants': 41,
          './lib/interval': 42,
          './lib/operations/algebra': 43,
          './lib/operations/arithmetic': 44,
          './lib/operations/misc': 46,
          './lib/operations/relational': 47,
          './lib/operations/trigonometric': 48,
          './lib/operations/utils': 49,
          './lib/polyfill': 50,
          './lib/round-math': 51,
          'xtend/mutable': 91
        }
      ],
      41: [
        function (require, module, exports) {
          'use strict'
          var Interval = require('./interval')
          var mutate = require('xtend/mutable')
          var piLow = (3373259426 + 273688 / (1 << 21)) / (1 << 30)
          var piHigh = (3373259426 + 273689 / (1 << 21)) / (1 << 30)
          var constants = {}
          mutate(constants, {
            PI_LOW: piLow,
            PI_HIGH: piHigh,
            PI_HALF_LOW: piLow / 2,
            PI_HALF_HIGH: piHigh / 2,
            PI_TWICE_LOW: piLow * 2,
            PI_TWICE_HIGH: piHigh * 2
          })
          function getter (property, fn) {
            Object.defineProperty(constants, property, {
              get: function () {
                return fn()
              },
              enumerable: true
            })
          }
          getter('PI', function () {
            return Interval(piLow, piHigh)
          })
          getter('PI_HALF', function () {
            return Interval(constants.PI_HALF_LOW, constants.PI_HALF_HIGH)
          })
          getter('PI_TWICE', function () {
            return Interval(constants.PI_TWICE_LOW, constants.PI_TWICE_HIGH)
          })
          getter('ZERO', function () {
            return Interval(0)
          })
          getter('ONE', function () {
            return Interval(1)
          })
          getter('WHOLE', function () {
            return Interval().setWhole()
          })
          getter('EMPTY', function () {
            return Interval().setEmpty()
          })
          module.exports = constants
        },
        { './interval': 42, 'xtend/mutable': 91 }
      ],
      42: [
        function (require, module, exports) {
          'use strict'
          var utils = require('./operations/utils')
          var round = require('./round-math')
          module.exports = Interval
          function Interval (lo, hi) {
            if (!(this instanceof Interval)) {
              return new Interval(lo, hi)
            }
            if (typeof lo !== 'undefined' && typeof hi !== 'undefined') {
              if (utils.isInterval(lo)) {
                if (!utils.isSingleton(lo)) {
                  throw new TypeError(
                    'Interval: interval `lo` must be a singleton'
                  )
                }
                lo = lo.lo
              }
              if (utils.isInterval(hi)) {
                if (!utils.isSingleton(hi)) {
                  throw TypeError('Interval: interval `hi` must be a singleton')
                }
                hi = hi.hi
              }
            } else if (typeof lo !== 'undefined') {
              if (Array.isArray(lo)) {
                return Interval(lo[0], lo[1])
              }
              return Interval(lo, lo)
            } else {
              lo = hi = 0
            }
            this.lo = undefined
            this.hi = undefined
            this.assign(lo, hi)
          }
          Interval.factory = Interval
          Interval.prototype.singleton = function (v) {
            return this.set(v, v)
          }
          Interval.prototype.bounded = function (lo, hi) {
            return this.set(round.prev(lo), round.next(hi))
          }
          Interval.prototype.boundedSingleton = function (v) {
            return this.bounded(v, v)
          }
          Interval.prototype.set = function (lo, hi) {
            this.lo = lo
            this.hi = hi
            return this
          }
          Interval.prototype.assign = function (lo, hi) {
            if (typeof lo !== 'number' || typeof hi !== 'number') {
              throw TypeError('Interval#assign: arguments must be numbers')
            }
            if (isNaN(lo) || isNaN(hi) || lo > hi) {
              return this.setEmpty()
            }
            return this.set(lo, hi)
          }
          Interval.prototype.setEmpty = function () {
            return this.set(Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY)
          }
          Interval.prototype.setWhole = function () {
            return this.set(Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY)
          }
          Interval.prototype.open = function (lo, hi) {
            return this.assign(round.safeNext(lo), round.safePrev(hi))
          }
          Interval.prototype.halfOpenLeft = function (lo, hi) {
            return this.assign(round.safeNext(lo), hi)
          }
          Interval.prototype.halfOpenRight = function (lo, hi) {
            return this.assign(lo, round.safePrev(hi))
          }
          Interval.prototype.toArray = function () {
            return [this.lo, this.hi]
          }
          Interval.prototype.clone = function () {
            return Interval().set(this.lo, this.hi)
          }
        },
        { './operations/utils': 49, './round-math': 51 }
      ],
      43: [
        function (require, module, exports) {
          'use strict'
          var isSafeInteger = require('is-safe-integer')
          var Interval = require('../interval')
          var rmath = require('../round-math')
          var utils = require('./utils')
          var arithmetic = require('./arithmetic')
          var constants = require('../constants')
          var algebra = {}
          algebra.fmod = function (x, y) {
            if (utils.isEmpty(x) || utils.isEmpty(y)) {
              return constants.EMPTY
            }
            var yb = x.lo < 0 ? y.lo : y.hi
            var n = rmath.intLo(rmath.divLo(x.lo, yb))
            return arithmetic.sub(x, arithmetic.mul(y, Interval(n)))
          }
          algebra.multiplicativeInverse = function (x) {
            if (utils.isEmpty(x)) {
              return constants.EMPTY
            }
            if (utils.zeroIn(x)) {
              if (x.lo !== 0) {
                if (x.hi !== 0) {
                  return constants.WHOLE
                } else {
                  return Interval(
                    Number.NEGATIVE_INFINITY,
                    rmath.divHi(1, x.lo)
                  )
                }
              } else {
                if (x.hi !== 0) {
                  return Interval(
                    rmath.divLo(1, x.hi),
                    Number.POSITIVE_INFINITY
                  )
                } else {
                  return constants.EMPTY
                }
              }
            } else {
              return Interval(rmath.divLo(1, x.hi), rmath.divHi(1, x.lo))
            }
          }
          algebra.pow = function (x, power) {
            if (utils.isEmpty(x)) {
              return constants.EMPTY
            }
            if (typeof power === 'object') {
              if (!utils.isSingleton(power)) {
                return constants.EMPTY
              }
              power = power.lo
            }
            if (power === 0) {
              if (x.lo === 0 && x.hi === 0) {
                return constants.EMPTY
              } else {
                return constants.ONE
              }
            } else if (power < 0) {
              return algebra.multiplicativeInverse(algebra.pow(x, -power))
            }
            if (isSafeInteger(power)) {
              if (x.hi < 0) {
                var yl = rmath.powLo(-x.hi, power)
                var yh = rmath.powHi(-x.lo, power)
                if (power & 1) {
                  return Interval(-yh, -yl)
                } else {
                  return Interval(yl, yh)
                }
              } else if (x.lo < 0) {
                if (power & 1) {
                  return Interval(
                    -rmath.powLo(-x.lo, power),
                    rmath.powHi(x.hi, power)
                  )
                } else {
                  return Interval(0, rmath.powHi(Math.max(-x.lo, x.hi), power))
                }
              } else {
                return Interval(
                  rmath.powLo(x.lo, power),
                  rmath.powHi(x.hi, power)
                )
              }
            } else {
              console.warn(
                'power is not an integer, you should use nth-root instead, returning an empty interval'
              )
              return constants.EMPTY
            }
          }
          algebra.sqrt = function (x) {
            return algebra.nthRoot(x, 2)
          }
          algebra.nthRoot = function (x, n) {
            if (utils.isEmpty(x) || n < 0) {
              return constants.EMPTY
            }
            if (typeof n === 'object') {
              if (!utils.isSingleton(n)) {
                return constants.EMPTY
              }
              n = n.lo
            }
            var power = 1 / n
            if (x.hi < 0) {
              if (isSafeInteger(n) & (n & 1)) {
                var yl = rmath.powHi(-x.lo, power)
                var yh = rmath.powLo(-x.hi, power)
                return Interval(-yl, -yh)
              }
              return Interval.EMPTY
            } else if (x.lo < 0) {
              var yp = rmath.powHi(x.hi, power)
              if (isSafeInteger(n) & (n & 1)) {
                var yn = -rmath.powHi(-x.lo, power)
                return Interval(yn, yp)
              }
              return Interval(0, yp)
            } else {
              return Interval(
                rmath.powLo(x.lo, power),
                rmath.powHi(x.hi, power)
              )
            }
          }
          module.exports = algebra
        },
        {
          '../constants': 41,
          '../interval': 42,
          '../round-math': 51,
          './arithmetic': 44,
          './utils': 49,
          'is-safe-integer': 53
        }
      ],
      44: [
        function (require, module, exports) {
          'use strict'
          var Interval = require('../interval')
          var rmath = require('../round-math')
          var utils = require('./utils')
          var constants = require('../constants')
          var division = require('./division')
          var arithmetic = {}
          arithmetic.add = function (x, y) {
            return Interval(rmath.addLo(x.lo, y.lo), rmath.addHi(x.hi, y.hi))
          }
          arithmetic.subtract = function (x, y) {
            return Interval(rmath.subLo(x.lo, y.hi), rmath.subHi(x.hi, y.lo))
          }
          arithmetic.sub = arithmetic.subtract
          arithmetic.multiply = function (x, y) {
            if (utils.isEmpty(x) || utils.isEmpty(y)) {
              return constants.EMPTY
            }
            var xl = x.lo
            var xh = x.hi
            var yl = y.lo
            var yh = y.hi
            var out = Interval()
            if (xl < 0) {
              if (xh > 0) {
                if (yl < 0) {
                  if (yh > 0) {
                    out.lo = Math.min(rmath.mulLo(xl, yh), rmath.mulLo(xh, yl))
                    out.hi = Math.max(rmath.mulHi(xl, yl), rmath.mulHi(xh, yh))
                  } else {
                    out.lo = rmath.mulLo(xh, yl)
                    out.hi = rmath.mulHi(xl, yl)
                  }
                } else {
                  if (yh > 0) {
                    out.lo = rmath.mulLo(xl, yh)
                    out.hi = rmath.mulHi(xh, yh)
                  } else {
                    out.lo = 0
                    out.hi = 0
                  }
                }
              } else {
                if (yl < 0) {
                  if (yh > 0) {
                    out.lo = rmath.mulLo(xl, yh)
                    out.hi = rmath.mulHi(xl, yl)
                  } else {
                    out.lo = rmath.mulLo(xh, yh)
                    out.hi = rmath.mulHi(xl, yl)
                  }
                } else {
                  if (yh > 0) {
                    out.lo = rmath.mulLo(xl, yh)
                    out.hi = rmath.mulHi(xh, yl)
                  } else {
                    out.lo = 0
                    out.hi = 0
                  }
                }
              }
            } else {
              if (xh > 0) {
                if (yl < 0) {
                  if (yh > 0) {
                    out.lo = rmath.mulLo(xh, yl)
                    out.hi = rmath.mulHi(xh, yh)
                  } else {
                    out.lo = rmath.mulLo(xh, yl)
                    out.hi = rmath.mulHi(xl, yh)
                  }
                } else {
                  if (yh > 0) {
                    out.lo = rmath.mulLo(xl, yl)
                    out.hi = rmath.mulHi(xh, yh)
                  } else {
                    out.lo = 0
                    out.hi = 0
                  }
                }
              } else {
                out.lo = 0
                out.hi = 0
              }
            }
            return out
          }
          arithmetic.mul = arithmetic.multiply
          arithmetic.divide = function (x, y) {
            if (utils.isEmpty(x) || utils.isEmpty(y)) {
              return constants.EMPTY
            }
            if (utils.zeroIn(y)) {
              if (y.lo !== 0) {
                if (y.hi !== 0) {
                  return division.zero(x)
                } else {
                  return division.negative(x, y.lo)
                }
              } else {
                if (y.hi !== 0) {
                  return division.positive(x, y.hi)
                } else {
                  return constants.EMPTY
                }
              }
            } else {
              return division.nonZero(x, y)
            }
          }
          arithmetic.div = arithmetic.divide
          arithmetic.positive = function (x) {
            return Interval(x.lo, x.hi)
          }
          arithmetic.negative = function (x) {
            return Interval(-x.hi, -x.lo)
          }
          module.exports = arithmetic
        },
        {
          '../constants': 41,
          '../interval': 42,
          '../round-math': 51,
          './division': 45,
          './utils': 49
        }
      ],
      45: [
        function (require, module, exports) {
          'use strict'
          var Interval = require('../interval')
          var rmath = require('../round-math')
          var utils = require('./utils')
          var constants = require('../constants')
          var division = {
            nonZero: function (x, y) {
              var xl = x.lo
              var xh = x.hi
              var yl = y.lo
              var yh = y.hi
              var out = Interval()
              if (xh < 0) {
                if (yh < 0) {
                  out.lo = rmath.divLo(xh, yl)
                  out.hi = rmath.divHi(xl, yh)
                } else {
                  out.lo = rmath.divLo(xl, yl)
                  out.hi = rmath.divHi(xh, yh)
                }
              } else if (xl < 0) {
                if (yh < 0) {
                  out.lo = rmath.divLo(xh, yh)
                  out.hi = rmath.divHi(xl, yh)
                } else {
                  out.lo = rmath.divLo(xl, yl)
                  out.hi = rmath.divHi(xh, yl)
                }
              } else {
                if (yh < 0) {
                  out.lo = rmath.divLo(xh, yh)
                  out.hi = rmath.divHi(xl, yl)
                } else {
                  out.lo = rmath.divLo(xl, yh)
                  out.hi = rmath.divHi(xh, yl)
                }
              }
              return out
            },
            positive: function (x, v) {
              if (x.lo === 0 && x.hi === 0) {
                return x
              }
              if (utils.zeroIn(x)) {
                return constants.WHOLE
              }
              if (x.hi < 0) {
                return Interval(Number.NEGATIVE_INFINITY, rmath.divHi(x.hi, v))
              } else {
                return Interval(rmath.divLo(x.lo, v), Number.POSITIVE_INFINITY)
              }
            },
            negative: function (x, v) {
              if (x.lo === 0 && x.hi === 0) {
                return x
              }
              if (utils.zeroIn(x)) {
                return constants.WHOLE
              }
              if (x.hi < 0) {
                return Interval(rmath.divLo(x.hi, v), Number.POSITIVE_INFINITY)
              } else {
                return Interval(Number.NEGATIVE_INFINITY, rmath.divHi(x.lo, v))
              }
            },
            zero: function (x) {
              if (x.lo === 0 && x.hi === 0) {
                return x
              }
              return constants.WHOLE
            }
          }
          module.exports = division
        },
        {
          '../constants': 41,
          '../interval': 42,
          '../round-math': 51,
          './utils': 49
        }
      ],
      46: [
        function (require, module, exports) {
          'use strict'
          var constants = require('../constants')
          var Interval = require('../interval')
          var rmath = require('../round-math')
          var utils = require('./utils')
          var arithmetic = require('./arithmetic')
          var misc = {}
          misc.exp = function (x) {
            if (utils.isEmpty(x)) {
              return constants.EMPTY
            }
            return Interval(rmath.expLo(x.lo), rmath.expHi(x.hi))
          }
          misc.log = function (x) {
            if (utils.isEmpty(x)) {
              return constants.EMPTY
            }
            var l = x.lo <= 0 ? Number.NEGATIVE_INFINITY : rmath.logLo(x.lo)
            return Interval(l, rmath.logHi(x.hi))
          }
          misc.ln = misc.log
          misc.LOG_EXP_10 = misc.log(Interval(10, 10))
          misc.log10 = function (x) {
            if (utils.isEmpty(x)) {
              return constants.EMPTY
            }
            return arithmetic.div(misc.log(x), misc.LOG_EXP_10)
          }
          misc.LOG_EXP_2 = misc.log(Interval(2, 2))
          misc.log2 = function (x) {
            if (utils.isEmpty(x)) {
              return constants.EMPTY
            }
            return arithmetic.div(misc.log(x), misc.LOG_EXP_2)
          }
          misc.hull = function (x, y) {
            var badX = utils.isEmpty(x)
            var badY = utils.isEmpty(y)
            if (badX && badY) {
              return constants.EMPTY
            } else if (badX) {
              return y.clone()
            } else if (badY) {
              return x.clone()
            } else {
              return Interval(Math.min(x.lo, y.lo), Math.max(x.hi, y.hi))
            }
          }
          misc.intersection = function (x, y) {
            if (utils.isEmpty(x) || utils.isEmpty(y)) {
              return constants.EMPTY
            }
            var lo = Math.max(x.lo, y.lo)
            var hi = Math.min(x.hi, y.hi)
            if (lo <= hi) {
              return Interval(lo, hi)
            }
            return constants.EMPTY
          }
          misc.union = function (x, y) {
            if (!utils.intervalsOverlap(x, y)) {
              throw Error('Interval#union: intervals do not overlap')
            }
            return Interval(Math.min(x.lo, y.lo), Math.max(x.hi, y.hi))
          }
          misc.difference = function (x, y) {
            if (utils.isEmpty(x) || utils.isWhole(y)) {
              return constants.EMPTY
            }
            if (utils.intervalsOverlap(x, y)) {
              if (x.lo < y.lo && y.hi < x.hi) {
                throw Error(
                  'Interval.difference: difference creates multiple intervals'
                )
              }
              if (
                (y.lo <= x.lo && y.hi === Infinity) ||
                (y.hi >= x.hi && y.lo === -Infinity)
              ) {
                return constants.EMPTY
              }
              if (y.lo <= x.lo) {
                return Interval().halfOpenLeft(y.hi, x.hi)
              }
              return Interval().halfOpenRight(x.lo, y.lo)
            }
            return Interval.clone(x)
          }
          misc.width = function (x) {
            if (utils.isEmpty(x)) {
              return 0
            }
            return rmath.subHi(x.hi, x.lo)
          }
          misc.wid = misc.width
          misc.abs = function (x) {
            if (utils.isEmpty(x)) {
              return constants.EMPTY
            }
            if (x.lo >= 0) {
              return Interval.clone(x)
            }
            if (x.hi <= 0) {
              return arithmetic.negative(x)
            }
            return Interval(0, Math.max(-x.lo, x.hi))
          }
          misc.max = function (x, y) {
            var badX = utils.isEmpty(x)
            var badY = utils.isEmpty(y)
            if (badX && badY) {
              return constants.EMPTY
            } else if (badX) {
              return y.clone()
            } else if (badY) {
              return x.clone()
            } else {
              return Interval(Math.max(x.lo, y.lo), Math.max(x.hi, y.hi))
            }
          }
          misc.min = function (x, y) {
            var badX = utils.isEmpty(x)
            var badY = utils.isEmpty(y)
            if (badX && badY) {
              return constants.EMPTY
            } else if (badX) {
              return y.clone()
            } else if (badY) {
              return x.clone()
            } else {
              return Interval(Math.min(x.lo, y.lo), Math.min(x.hi, y.hi))
            }
          }
          misc.clone = function (x) {
            return Interval().set(x.lo, x.hi)
          }
          module.exports = misc
        },
        {
          '../constants': 41,
          '../interval': 42,
          '../round-math': 51,
          './arithmetic': 44,
          './utils': 49
        }
      ],
      47: [
        function (require, module, exports) {
          'use strict'
          var utils = require('./utils')
          var relational = {}
          relational.equal = function (x, y) {
            if (utils.isEmpty(x)) {
              return utils.isEmpty(y)
            }
            return !utils.isEmpty(y) && x.lo === y.lo && x.hi === y.hi
          }
          relational.almostEqual = function (x, y) {
            var EPS = 1e-7
            function assert (a, message) {
              if (!a) {
                throw new Error(message || 'assertion failed')
              }
            }
            function assertEps (a, b) {
              assert(
                Math.abs(a - b) < EPS,
                'expected ' + a + ' to be close to ' + b
              )
            }
            x = Array.isArray(x) ? x : x.toArray()
            y = Array.isArray(y) ? y : y.toArray()
            assertEps(x[0], y[0])
            assertEps(x[1], y[1])
            assert(x[0] <= x[1], 'interval must not be empty')
          }
          relational.notEqual = function (x, y) {
            if (utils.isEmpty(x)) {
              return !utils.isEmpty(y)
            }
            return utils.isEmpty(y) || x.hi < y.lo || x.lo > y.hi
          }
          relational.lessThan = function (x, y) {
            if (utils.isEmpty(x) || utils.isEmpty(y)) {
              return false
            }
            return x.hi < y.lo
          }
          relational.lt = relational.lessThan
          relational.greaterThan = function (x, y) {
            if (utils.isEmpty(x) || utils.isEmpty(y)) {
              return false
            }
            return x.lo > y.hi
          }
          relational.gt = relational.greaterThan
          relational.lessEqualThan = function (x, y) {
            if (utils.isEmpty(x) || utils.isEmpty(y)) {
              return false
            }
            return x.hi <= y.lo
          }
          relational.leq = relational.lessEqualThan
          relational.greaterEqualThan = function (x, y) {
            if (utils.isEmpty(x) || utils.isEmpty(y)) {
              return false
            }
            return x.lo >= y.hi
          }
          relational.geq = relational.greaterEqualThan
          module.exports = relational
        },
        { './utils': 49 }
      ],
      48: [
        function (require, module, exports) {
          'use strict'
          var constants = require('../constants')
          var Interval = require('../interval')
          var rmath = require('../round-math')
          var utils = require('./utils')
          var misc = require('./misc')
          var algebra = require('./algebra')
          var arithmetic = require('./arithmetic')
          var trigonometric = {}
          function onlyInfinity (x) {
            return !isFinite(x.lo) && x.lo === x.hi
          }
          function handleNegative (interval) {
            if (interval.lo < 0) {
              if (interval.lo === -Infinity) {
                interval.lo = 0
                interval.hi = Infinity
              } else {
                var n = Math.ceil(-interval.lo / constants.PI_TWICE_LOW)
                interval.lo += constants.PI_TWICE_LOW * n
                interval.hi += constants.PI_TWICE_LOW * n
              }
            }
            return interval
          }
          trigonometric.cos = function (x) {
            var rlo, rhi
            if (utils.isEmpty(x) || onlyInfinity(x)) {
              return constants.EMPTY
            }
            var cache = Interval()
            cache.set(x.lo, x.hi)
            handleNegative(cache)
            var pi2 = constants.PI_TWICE
            var t = algebra.fmod(cache, pi2)
            if (misc.width(t) >= pi2.lo) {
              return Interval(-1, 1)
            }
            if (t.lo >= constants.PI_HIGH) {
              var cos = trigonometric.cos(arithmetic.sub(t, constants.PI))
              return arithmetic.negative(cos)
            }
            var lo = t.lo
            var hi = t.hi
            rlo = rmath.cosLo(hi)
            rhi = rmath.cosHi(lo)
            if (hi <= constants.PI_LOW) {
              return Interval(rlo, rhi)
            } else if (hi <= pi2.lo) {
              return Interval(-1, Math.max(rlo, rhi))
            } else {
              return Interval(-1, 1)
            }
          }
          trigonometric.sin = function (x) {
            if (utils.isEmpty(x) || onlyInfinity(x)) {
              return constants.EMPTY
            }
            return trigonometric.cos(arithmetic.sub(x, constants.PI_HALF))
          }
          trigonometric.tan = function (x) {
            if (utils.isEmpty(x) || onlyInfinity(x)) {
              return constants.EMPTY
            }
            var cache = Interval()
            cache.set(x.lo, x.hi)
            handleNegative(cache)
            var pi = constants.PI
            var t = algebra.fmod(cache, pi)
            if (t.lo >= constants.PI_HALF_LOW) {
              t = arithmetic.sub(t, pi)
            }
            if (
              t.lo <= -constants.PI_HALF_LOW ||
              t.hi >= constants.PI_HALF_LOW
            ) {
              return constants.WHOLE
            }
            return Interval(rmath.tanLo(t.lo), rmath.tanHi(t.hi))
          }
          trigonometric.asin = function (x) {
            if (utils.isEmpty(x) || x.hi < -1 || x.lo > 1) {
              return constants.EMPTY
            }
            var lo = x.lo <= -1 ? -constants.PI_HALF_HIGH : rmath.asinLo(x.lo)
            var hi = x.hi >= 1 ? constants.PI_HALF_HIGH : rmath.asinHi(x.hi)
            return Interval(lo, hi)
          }
          trigonometric.acos = function (x) {
            if (utils.isEmpty(x) || x.hi < -1 || x.lo > 1) {
              return constants.EMPTY
            }
            var lo = x.hi >= 1 ? 0 : rmath.acosLo(x.hi)
            var hi = x.lo <= -1 ? constants.PI_HIGH : rmath.acosHi(x.lo)
            return Interval(lo, hi)
          }
          trigonometric.atan = function (x) {
            if (utils.isEmpty(x)) {
              return constants.EMPTY
            }
            return Interval(rmath.atanLo(x.lo), rmath.atanHi(x.hi))
          }
          trigonometric.sinh = function (x) {
            if (utils.isEmpty(x)) {
              return constants.EMPTY
            }
            return Interval(rmath.sinhLo(x.lo), rmath.sinhHi(x.hi))
          }
          trigonometric.cosh = function (x) {
            if (utils.isEmpty(x)) {
              return constants.EMPTY
            }
            if (x.hi < 0) {
              return Interval(rmath.coshLo(x.hi), rmath.coshHi(x.lo))
            } else if (x.lo >= 0) {
              return Interval(rmath.coshLo(x.lo), rmath.coshHi(x.hi))
            } else {
              return Interval(1, rmath.coshHi(-x.lo > x.hi ? x.lo : x.hi))
            }
          }
          trigonometric.tanh = function (x) {
            if (utils.isEmpty(x)) {
              return constants.EMPTY
            }
            return Interval(rmath.tanhLo(x.lo), rmath.tanhHi(x.hi))
          }
          module.exports = trigonometric
        },
        {
          '../constants': 41,
          '../interval': 42,
          '../round-math': 51,
          './algebra': 43,
          './arithmetic': 44,
          './misc': 46,
          './utils': 49
        }
      ],
      49: [
        function (require, module, exports) {
          'use strict'
          var utils = {}
          utils.isInterval = function (x) {
            return (
              typeof x === 'object' &&
              typeof x.lo === 'number' &&
              typeof x.hi === 'number'
            )
          }
          utils.isEmpty = function (x) {
            return x.lo > x.hi
          }
          utils.isWhole = function (x) {
            return x.lo === -Infinity && x.hi === Infinity
          }
          utils.isSingleton = function (x) {
            return x.lo === x.hi
          }
          utils.zeroIn = function (x) {
            return utils.hasValue(x, 0)
          }
          utils.hasValue = function (a, value) {
            if (utils.isEmpty(a)) {
              return false
            }
            return a.lo <= value && value <= a.hi
          }
          utils.hasInterval = function (x, y) {
            if (utils.isEmpty(x)) {
              return true
            }
            return !utils.isEmpty(y) && y.lo <= x.lo && x.hi <= y.hi
          }
          utils.intervalsOverlap = function (x, y) {
            if (utils.isEmpty(x) || utils.isEmpty(y)) {
              return false
            }
            return (
              (x.lo <= y.lo && y.lo <= x.hi) || (y.lo <= x.lo && x.lo <= y.hi)
            )
          }
          module.exports = utils
        },
        {}
      ],
      50: [
        function (require, module, exports) {
          'use strict'
          Math.sinh =
            Math.sinh ||
            function (x) {
              var y = Math.exp(x)
              return (y - 1 / y) / 2
            }
          Math.cosh =
            Math.cosh ||
            function (x) {
              var y = Math.exp(x)
              return (y + 1 / y) / 2
            }
          Math.tanh =
            Math.tanh ||
            function (x) {
              if (x === Number.POSITIVE_INFINITY) {
                return 1
              } else if (x === Number.NEGATIVE_INFINITY) {
                return -1
              } else {
                var y = Math.exp(2 * x)
                return (y - 1) / (y + 1)
              }
            }
        },
        {}
      ],
      51: [
        function (require, module, exports) {
          'use strict'
          var nextafter = require('nextafter')
          function identity (v) {
            return v
          }
          function prev (v) {
            if (v === Infinity) {
              return v
            }
            return nextafter(v, -Infinity)
          }
          function next (v) {
            if (v === -Infinity) {
              return v
            }
            return nextafter(v, Infinity)
          }
          var round = { safePrev: prev, safeNext: next, prev: prev, next: next }
          round.addLo = function (x, y) {
            return this.prev(x + y)
          }
          round.addHi = function (x, y) {
            return this.next(x + y)
          }
          round.subLo = function (x, y) {
            return this.prev(x - y)
          }
          round.subHi = function (x, y) {
            return this.next(x - y)
          }
          round.mulLo = function (x, y) {
            return this.prev(x * y)
          }
          round.mulHi = function (x, y) {
            return this.next(x * y)
          }
          round.divLo = function (x, y) {
            return this.prev(x / y)
          }
          round.divHi = function (x, y) {
            return this.next(x / y)
          }
          function toInteger (x) {
            return x < 0 ? Math.ceil(x) : Math.floor(x)
          }
          round.intLo = function (x) {
            return toInteger(this.prev(x))
          }
          round.intHi = function (x) {
            return toInteger(this.next(x))
          }
          round.logLo = function (x) {
            return this.prev(Math.log(x))
          }
          round.logHi = function (x) {
            return this.next(Math.log(x))
          }
          round.expLo = function (x) {
            return this.prev(Math.exp(x))
          }
          round.expHi = function (x) {
            return this.next(Math.exp(x))
          }
          round.sinLo = function (x) {
            return this.prev(Math.sin(x))
          }
          round.sinHi = function (x) {
            return this.next(Math.sin(x))
          }
          round.cosLo = function (x) {
            return this.prev(Math.cos(x))
          }
          round.cosHi = function (x) {
            return this.next(Math.cos(x))
          }
          round.tanLo = function (x) {
            return this.prev(Math.tan(x))
          }
          round.tanHi = function (x) {
            return this.next(Math.tan(x))
          }
          round.asinLo = function (x) {
            return this.prev(Math.asin(x))
          }
          round.asinHi = function (x) {
            return this.next(Math.asin(x))
          }
          round.acosLo = function (x) {
            return this.prev(Math.acos(x))
          }
          round.acosHi = function (x) {
            return this.next(Math.acos(x))
          }
          round.atanLo = function (x) {
            return this.prev(Math.atan(x))
          }
          round.atanHi = function (x) {
            return this.next(Math.atan(x))
          }
          round.sinhLo = function (x) {
            return this.prev(Math.sinh(x))
          }
          round.sinhHi = function (x) {
            return this.next(Math.sinh(x))
          }
          round.coshLo = function (x) {
            return this.prev(Math.cosh(x))
          }
          round.coshHi = function (x) {
            return this.next(Math.cosh(x))
          }
          round.tanhLo = function (x) {
            return this.prev(Math.tanh(x))
          }
          round.tanhHi = function (x) {
            return this.next(Math.tanh(x))
          }
          round.powLo = function (x, power) {
            if (power % 1 !== 0) {
              return this.prev(Math.pow(x, power))
            }
            var y = power & 1 ? x : 1
            power >>= 1
            while (power > 0) {
              x = round.mulLo(x, x)
              if (power & 1) {
                y = round.mulLo(x, y)
              }
              power >>= 1
            }
            return y
          }
          round.powHi = function (x, power) {
            if (power % 1 !== 0) {
              return this.next(Math.pow(x, power))
            }
            var y = power & 1 ? x : 1
            power >>= 1
            while (power > 0) {
              x = round.mulHi(x, x)
              if (power & 1) {
                y = round.mulHi(x, y)
              }
              power >>= 1
            }
            return y
          }
          round.sqrtLo = function (x) {
            return this.prev(Math.sqrt(x))
          }
          round.sqrtHi = function (x) {
            return this.next(Math.sqrt(x))
          }
          round.disable = function () {
            this.next = this.prev = identity
          }
          round.enable = function () {
            this.next = next
            this.prev = prev
          }
          module.exports = round
        },
        { nextafter: 88 }
      ],
      52: [
        function (require, module, exports) {
          'use strict'
          module.exports = function isObject (x) {
            return typeof x === 'object' && x !== null
          }
        },
        {}
      ],
      53: [
        function (require, module, exports) {
          'use strict'
          var MAX_SAFE_INTEGER = require('max-safe-integer')
          module.exports =
            Number.isSafeInteger ||
            function (val) {
              return (
                typeof val === 'number' &&
                val === val &&
                val !== Infinity &&
                val !== -Infinity &&
                parseInt(val, 10) === val &&
                Math.abs(val) <= MAX_SAFE_INTEGER
              )
            }
        },
        { 'max-safe-integer': 72 }
      ],
      54: [
        function (require, module, exports) {
          ;(function (process) {
            var keys = require('vkey')
            var list = Object.keys(keys)
            var down = {}
            reset()
            module.exports = pressed
            if (process.browser) {
              window.addEventListener('keydown', keydown, false)
              window.addEventListener('keyup', keyup, false)
              window.addEventListener('blur', reset, false)
            }
            function pressed (key) {
              return key ? down[key] : down
            }
            function reset () {
              list.forEach(function (code) {
                down[keys[code]] = false
              })
            }
            function keyup (e) {
              down[keys[e.keyCode]] = false
            }
            function keydown (e) {
              down[keys[e.keyCode]] = true
            }
          }.call(this, require('_process')))
        },
        { _process: 89, vkey: 90 }
      ],
      55: [
        function (require, module, exports) {
          var Emitter = require('events').EventEmitter
          var vkey = require('vkey')
          module.exports = function (keys, el) {
            if (typeof keys === 'string') keys = [keys]
            if (!el) el = window
            var emitter = new Emitter()
            emitter.pressed = {}
            el.addEventListener('blur', clearPressed)
            el.addEventListener('focus', clearPressed)
            el.addEventListener('keydown', function (ev) {
              var key = vkey[ev.keyCode]
              emitter.pressed[key] = true
              var allPressed = true
              keys.forEach(function (k) {
                if (!emitter.pressed[k]) allPressed = false
              })
              if (allPressed) {
                emitter.emit('pressed', emitter.pressed)
                clearPressed()
              }
            })
            el.addEventListener('keyup', function (ev) {
              delete emitter.pressed[vkey[ev.keyCode]]
            })
            function clearPressed () {
              emitter.pressed = {}
            }
            return emitter
          }
        },
        { events: 31, vkey: 90 }
      ],
      56: [
        function (require, module, exports) {
          var integers = require('integers')
          module.exports = function linspace (a, b, n) {
            var every = (b - a) / (n - 1),
              ranged = integers(a, b, every)
            return ranged.length == n ? ranged : ranged.concat(b)
          }
        },
        { integers: 34 }
      ],
      57: [
        function (require, module, exports) {
          'use strict'
          module.exports =
            Math.log10 ||
            function (x) {
              return Math.log(x) * Math.LOG10E
            }
        },
        {}
      ],
      58: [
        function (require, module, exports) {
          var linspace = require('linspace')
          module.exports = function logspace (a, b, n) {
            return linspace(a, b, n).map(function (x) {
              return Math.pow(10, x)
            })
          }
        },
        { linspace: 56 }
      ],
      59: [
        function (require, module, exports) {
          'use strict'
          module.exports = require('./lib/CodeGenerator')
        },
        { './lib/CodeGenerator': 60 }
      ],
      60: [
        function (require, module, exports) {
          'use strict'
          var Parser = require('mr-parser').Parser
          var Interpreter = require('./Interpreter')
          var extend = require('extend')
          function CodeGenerator (options, defs) {
            this.statements = []
            this.defs = defs || {}
            this.interpreter = new Interpreter(this, options)
          }
          CodeGenerator.prototype.setDefs = function (defs) {
            this.defs = extend(this.defs, defs)
            return this
          }
          CodeGenerator.prototype.compile = function (namespace) {
            if (
              !namespace ||
              !(
                typeof namespace === 'object' || typeof namespace === 'function'
              )
            ) {
              throw TypeError('namespace must be an object')
            }
            if (typeof namespace.factory !== 'function') {
              throw TypeError('namespace.factory must be a function')
            }
            this.defs.ns = namespace
            this.defs.$$mathCodegen = {
              getProperty: function (symbol, scope, ns) {
                if (symbol in scope) {
                  return scope[symbol]
                }
                if (symbol in ns) {
                  return ns[symbol]
                }
                throw SyntaxError('symbol "' + symbol + '" is undefined')
              },
              functionProxy: function (fn, name) {
                if (typeof fn !== 'function') {
                  throw SyntaxError('symbol "' + name + '" must be a function')
                }
                return fn
              }
            }
            this.defs.$$processScope =
              this.defs.$$processScope || function () {}
            var defsCode = Object.keys(this.defs).map(function (name) {
              return 'var ' + name + ' = defs["' + name + '"]'
            })
            if (!this.statements.length) {
              throw Error(
                'there are no statements saved in this generator, make sure you parse an expression before compiling it'
              )
            }
            this.statements[this.statements.length - 1] =
              'return ' + this.statements[this.statements.length - 1]
            var code = this.statements.join(';')
            var factoryCode =
              defsCode.join('\n') +
              '\n' +
              [
                'return {',
                '  eval: function (scope) {',
                '    scope = scope || {}',
                '    $$processScope(scope)',
                '    ' + code,
                '  },',
                "  code: '" + code + "'",
                '}'
              ].join('\n')
            var factory = new Function('defs', factoryCode)
            return factory(this.defs)
          }
          CodeGenerator.prototype.parse = function (code) {
            var self = this
            var program = new Parser().parse(code)
            this.statements = program.blocks.map(function (statement) {
              return self.interpreter.next(statement)
            })
            return this
          }
          module.exports = CodeGenerator
        },
        { './Interpreter': 61, extend: 32, 'mr-parser': 73 }
      ],
      61: [
        function (require, module, exports) {
          'use strict'
          var extend = require('extend')
          var types = {
            ArrayNode: require('./node/ArrayNode'),
            AssignmentNode: require('./node/AssignmentNode'),
            ConditionalNode: require('./node/ConditionalNode'),
            ConstantNode: require('./node/ConstantNode'),
            FunctionNode: require('./node/FunctionNode'),
            OperatorNode: require('./node/OperatorNode'),
            SymbolNode: require('./node/SymbolNode'),
            UnaryNode: require('./node/UnaryNode')
          }
          var Interpreter = function (owner, options) {
            this.owner = owner
            this.options = extend(
              {
                factory: 'ns.factory',
                raw: false,
                rawArrayExpressionElements: true,
                rawCallExpressionElements: false
              },
              options
            )
          }
          extend(Interpreter.prototype, types)
          Interpreter.prototype.next = function (node) {
            if (!(node.type in this)) {
              throw new TypeError(
                'the node type ' + node.type + ' is not implemented'
              )
            }
            return this[node.type](node)
          }
          Interpreter.prototype.rawify = function (test, fn) {
            var oldRaw = this.options.raw
            if (test) {
              this.options.raw = true
            }
            fn()
            if (test) {
              this.options.raw = oldRaw
            }
          }
          module.exports = Interpreter
        },
        {
          './node/ArrayNode': 64,
          './node/AssignmentNode': 65,
          './node/ConditionalNode': 66,
          './node/ConstantNode': 67,
          './node/FunctionNode': 68,
          './node/OperatorNode': 69,
          './node/SymbolNode': 70,
          './node/UnaryNode': 71,
          extend: 32
        }
      ],
      62: [
        function (require, module, exports) {
          'use strict'
          module.exports = {
            '+': 'add',
            '-': 'sub',
            '*': 'mul',
            '/': 'div',
            '^': 'pow',
            '%': 'mod',
            '!': 'factorial',
            '|': 'bitwiseOR',
            '^|': 'bitwiseXOR',
            '&': 'bitwiseAND',
            '||': 'logicalOR',
            xor: 'logicalXOR',
            '&&': 'logicalAND',
            '<': 'lessThan',
            '>': 'greaterThan',
            '<=': 'lessEqualThan',
            '>=': 'greaterEqualThan',
            '===': 'strictlyEqual',
            '==': 'equal',
            '!==': 'strictlyNotEqual',
            '!=': 'notEqual',
            '>>': 'shiftRight',
            '<<': 'shiftLeft',
            '>>>': 'unsignedRightShift'
          }
        },
        {}
      ],
      63: [
        function (require, module, exports) {
          'use strict'
          module.exports = {
            '+': 'positive',
            '-': 'negative',
            '~': 'oneComplement'
          }
        },
        {}
      ],
      64: [
        function (require, module, exports) {
          'use strict'
          module.exports = function (node) {
            var self = this
            var arr = []
            this.rawify(this.options.rawArrayExpressionElements, function () {
              arr = node.nodes.map(function (el) {
                return self.next(el)
              })
            })
            var arrString = '[' + arr.join(',') + ']'
            if (this.options.raw) {
              return arrString
            }
            return this.options.factory + '(' + arrString + ')'
          }
        },
        {}
      ],
      65: [
        function (require, module, exports) {
          'use strict'
          module.exports = function (node) {
            return 'scope["' + node.name + '"] = ' + this.next(node.expr)
          }
        },
        {}
      ],
      66: [
        function (require, module, exports) {
          'use strict'
          module.exports = function (node) {
            var condition = '!!(' + this.next(node.condition) + ')'
            var trueExpr = this.next(node.trueExpr)
            var falseExpr = this.next(node.falseExpr)
            return (
              '(' + condition + ' ? (' + trueExpr + ') : (' + falseExpr + ') )'
            )
          }
        },
        {}
      ],
      67: [
        function (require, module, exports) {
          'use strict'
          module.exports = function (node) {
            if (this.options.raw) {
              return node.value
            }
            return this.options.factory + '(' + node.value + ')'
          }
        },
        {}
      ],
      68: [
        function (require, module, exports) {
          'use strict'
          var SymbolNode = require('mr-parser').nodeTypes.SymbolNode
          var functionProxy = function (node) {
            return (
              '$$mathCodegen.functionProxy(' +
              this.next(new SymbolNode(node.name)) +
              ', "' +
              node.name +
              '")'
            )
          }
          module.exports = function (node) {
            var self = this
            var method = functionProxy.call(this, node)
            var args = []
            this.rawify(this.options.rawCallExpressionElements, function () {
              args = node.args.map(function (arg) {
                return self.next(arg)
              })
            })
            return method + '(' + args.join(', ') + ')'
          }
          module.exports.functionProxy = functionProxy
        },
        { 'mr-parser': 73 }
      ],
      69: [
        function (require, module, exports) {
          'use strict'
          var Operators = require('../misc/Operators')
          module.exports = function (node) {
            if (this.options.raw) {
              return [
                '(' + this.next(node.args[0]),
                node.op,
                this.next(node.args[1]) + ')'
              ].join(' ')
            }
            var namedOperator = Operators[node.op]
            if (!namedOperator) {
              throw TypeError('unidentified operator')
            }
            return this.FunctionNode({ name: namedOperator, args: node.args })
          }
        },
        { '../misc/Operators': 62 }
      ],
      70: [
        function (require, module, exports) {
          'use strict'
          module.exports = function (node) {
            var id = node.name
            return '$$mathCodegen.getProperty("' + id + '", scope, ns)'
          }
        },
        {}
      ],
      71: [
        function (require, module, exports) {
          'use strict'
          var UnaryOperators = require('../misc/UnaryOperators')
          module.exports = function (node) {
            if (this.options.raw) {
              return node.op + this.next(node.argument)
            }
            if (!(node.op in UnaryOperators)) {
              throw new SyntaxError(node.op + ' not implemented')
            }
            var namedOperator = UnaryOperators[node.op]
            return this.FunctionNode({
              name: namedOperator,
              args: [node.argument]
            })
          }
        },
        { '../misc/UnaryOperators': 63 }
      ],
      72: [
        function (require, module, exports) {
          'use strict'
          module.exports = 9007199254740991
        },
        {}
      ],
      73: [
        function (require, module, exports) {
          'use strict'
          module.exports.Lexer = require('./lib/Lexer')
          module.exports.Parser = require('./lib/Parser')
          module.exports.nodeTypes = require('./lib/node/')
        },
        { './lib/Lexer': 74, './lib/Parser': 75, './lib/node/': 86 }
      ],
      74: [
        function (require, module, exports) {
          var tokenType = require('./token-type')
          var ESCAPES = {
            n: '\n',
            f: '\f',
            r: '\r',
            t: '	',
            v: '',
            "'": "'",
            '"': '"'
          }
          var DELIMITERS = {
            ',': true,
            '(': true,
            ')': true,
            '[': true,
            ']': true,
            ';': true,
            '~': true,
            '!': true,
            '+': true,
            '-': true,
            '*': true,
            '/': true,
            '%': true,
            '^': true,
            '**': true,
            '|': true,
            '&': true,
            '^|': true,
            '=': true,
            ':': true,
            '?': true,
            '||': true,
            '&&': true,
            xor: true,
            '==': true,
            '!=': true,
            '===': true,
            '!==': true,
            '<': true,
            '>': true,
            '>=': true,
            '<=': true,
            '>>>': true,
            '<<': true,
            '>>': true
          }
          function isDigit (c) {
            return c >= '0' && c <= '9'
          }
          function isIdentifier (c) {
            return (
              (c >= 'a' && c <= 'z') ||
              (c >= 'A' && c <= 'Z') ||
              c === '$' ||
              c === '_'
            )
          }
          function isWhitespace (c) {
            return (
              c === ' ' ||
              c === '\r' ||
              c === '	' ||
              c === '\n' ||
              c === '' ||
              c === ' '
            )
          }
          function isDelimiter (str) {
            return DELIMITERS[str]
          }
          function isQuote (c) {
            return c === "'" || c === '"'
          }
          function Lexer () {}
          Lexer.prototype.throwError = function (message, index) {
            index = typeof index === 'undefined' ? this.index : index
            var error = new Error(message + ' at index ' + index)
            error.index = index
            error.description = message
            throw error
          }
          Lexer.prototype.lex = function (text) {
            this.text = text
            this.index = 0
            this.tokens = []
            while (this.index < this.text.length) {
              while (isWhitespace(this.peek())) {
                this.consume()
              }
              var c = this.peek()
              var c2 = c + this.peek(1)
              var c3 = c2 + this.peek(2)
              if (isDelimiter(c3)) {
                this.tokens.push({ type: tokenType.DELIMITER, value: c3 })
                this.consume()
                this.consume()
                this.consume()
              } else if (isDelimiter(c2)) {
                this.tokens.push({ type: tokenType.DELIMITER, value: c2 })
                this.consume()
                this.consume()
              } else if (isDelimiter(c)) {
                this.tokens.push({ type: tokenType.DELIMITER, value: c })
                this.consume()
              } else if (isDigit(c) || (c === '.' && isDigit(this.peek(1)))) {
                this.tokens.push({
                  type: tokenType.NUMBER,
                  value: this.readNumber()
                })
              } else if (isQuote(c)) {
                this.tokens.push({
                  type: tokenType.STRING,
                  value: this.readString()
                })
              } else if (isIdentifier(c)) {
                this.tokens.push({
                  type: tokenType.SYMBOL,
                  value: this.readIdentifier()
                })
              } else {
                this.throwError('unexpected character ' + c)
              }
            }
            this.tokens.push({ type: tokenType.EOF })
            return this.tokens
          }
          Lexer.prototype.peek = function (nth) {
            nth = nth || 0
            if (this.index + nth >= this.text.length) {
              return
            }
            return this.text.charAt(this.index + nth)
          }
          Lexer.prototype.consume = function () {
            var current = this.peek()
            this.index += 1
            return current
          }
          Lexer.prototype.readNumber = function () {
            var number = ''
            if (this.peek() === '.') {
              number += this.consume()
              if (!isDigit(this.peek())) {
                this.throwError('number expected')
              }
            } else {
              while (isDigit(this.peek())) {
                number += this.consume()
              }
              if (this.peek() === '.') {
                number += this.consume()
              }
            }
            while (isDigit(this.peek())) {
              number += this.consume()
            }
            if (this.peek() === 'e' || this.peek() === 'E') {
              number += this.consume()
              if (
                !(
                  isDigit(this.peek()) ||
                  this.peek() === '+' ||
                  this.peek() === '-'
                )
              ) {
                this.throwError()
              }
              if (this.peek() === '+' || this.peek() === '-') {
                number += this.consume()
              }
              if (!isDigit(this.peek())) {
                this.throwError('number expected')
              }
              while (isDigit(this.peek())) {
                number += this.consume()
              }
            }
            return number
          }
          Lexer.prototype.readIdentifier = function () {
            var text = ''
            while (isIdentifier(this.peek()) || isDigit(this.peek())) {
              text += this.consume()
            }
            return text
          }
          Lexer.prototype.readString = function () {
            var quote = this.consume()
            var string = ''
            var escape
            while (true) {
              var c = this.consume()
              if (!c) {
                this.throwError('string is not closed')
              }
              if (escape) {
                if (c === 'u') {
                  var hex = this.text.substring(this.index + 1, this.index + 5)
                  if (!hex.match(/[\da-f]{4}/i)) {
                    this.throwError('invalid unicode escape')
                  }
                  this.index += 4
                  string += String.fromCharCode(parseInt(hex, 16))
                } else {
                  var replacement = ESCAPES[c]
                  if (replacement) {
                    string += replacement
                  } else {
                    string += c
                  }
                }
                escape = false
              } else if (c === quote) {
                break
              } else if (c === '\\') {
                escape = true
              } else {
                string += c
              }
            }
            return string
          }
          module.exports = Lexer
        },
        { './token-type': 87 }
      ],
      75: [
        function (require, module, exports) {
          var tokenType = require('./token-type')
          var Lexer = require('./Lexer')
          var ConstantNode = require('./node/ConstantNode')
          var OperatorNode = require('./node/OperatorNode')
          var UnaryNode = require('./node/UnaryNode')
          var SymbolNode = require('./node/SymbolNode')
          var FunctionNode = require('./node/FunctionNode')
          var ArrayNode = require('./node/ArrayNode')
          var ConditionalNode = require('./node/ConditionalNode')
          var AssignmentNode = require('./node/AssignmentNode')
          var BlockNode = require('./node/BlockNode')
          function Parser () {
            this.lexer = new Lexer()
            this.tokens = null
          }
          Parser.prototype.current = function () {
            return this.tokens[0]
          }
          Parser.prototype.next = function () {
            return this.tokens[1]
          }
          Parser.prototype.peek = function () {
            if (this.tokens.length) {
              var first = this.tokens[0]
              for (var i = 0; i < arguments.length; i += 1) {
                if (first.value === arguments[i]) {
                  return true
                }
              }
            }
          }
          Parser.prototype.consume = function (e) {
            return this.tokens.shift()
          }
          Parser.prototype.expect = function (e) {
            if (!this.peek(e)) {
              throw Error('expected ' + e)
            }
            return this.consume()
          }
          Parser.prototype.isEOF = function () {
            return this.current().type === tokenType.EOF
          }
          Parser.prototype.parse = function (text) {
            this.tokens = this.lexer.lex(text)
            return this.program()
          }
          Parser.prototype.program = function () {
            var blocks = []
            while (!this.isEOF()) {
              blocks.push(this.assignment())
              if (this.peek(';')) {
                this.consume()
              }
            }
            this.end()
            return new BlockNode(blocks)
          }
          Parser.prototype.assignment = function () {
            var left = this.ternary()
            if (left instanceof SymbolNode && this.peek('=')) {
              this.consume()
              return new AssignmentNode(left.name, this.assignment())
            }
            return left
          }
          Parser.prototype.ternary = function () {
            var predicate = this.logicalOR()
            if (this.peek('?')) {
              this.consume()
              var truthy = this.ternary()
              this.expect(':')
              var falsy = this.ternary()
              return new ConditionalNode(predicate, truthy, falsy)
            }
            return predicate
          }
          Parser.prototype.logicalOR = function () {
            var left = this.logicalXOR()
            if (this.peek('||')) {
              var op = this.consume()
              var right = this.logicalOR()
              return new OperatorNode(op.value, [left, right])
            }
            return left
          }
          Parser.prototype.logicalXOR = function () {
            var left = this.logicalAND()
            if (this.current().value === 'xor') {
              var op = this.consume()
              var right = this.logicalXOR()
              return new OperatorNode(op.value, [left, right])
            }
            return left
          }
          Parser.prototype.logicalAND = function () {
            var left = this.bitwiseOR()
            if (this.peek('&&')) {
              var op = this.consume()
              var right = this.logicalAND()
              return new OperatorNode(op.value, [left, right])
            }
            return left
          }
          Parser.prototype.bitwiseOR = function () {
            var left = this.bitwiseXOR()
            if (this.peek('|')) {
              var op = this.consume()
              var right = this.bitwiseOR()
              return new OperatorNode(op.value, [left, right])
            }
            return left
          }
          Parser.prototype.bitwiseXOR = function () {
            var left = this.bitwiseAND()
            if (this.peek('^|')) {
              var op = this.consume()
              var right = this.bitwiseXOR()
              return new OperatorNode(op.value, [left, right])
            }
            return left
          }
          Parser.prototype.bitwiseAND = function () {
            var left = this.relational()
            if (this.peek('&')) {
              var op = this.consume()
              var right = this.bitwiseAND()
              return new OperatorNode(op.value, [left, right])
            }
            return left
          }
          Parser.prototype.relational = function () {
            var left = this.shift()
            if (this.peek('==', '===', '!=', '!==', '>=', '<=', '>', '<')) {
              var op = this.consume()
              var right = this.shift()
              return new OperatorNode(op.value, [left, right])
            }
            return left
          }
          Parser.prototype.shift = function () {
            var left = this.additive()
            if (this.peek('>>', '<<', '>>>')) {
              var op = this.consume()
              var right = this.shift()
              return new OperatorNode(op.value, [left, right])
            }
            return left
          }
          Parser.prototype.additive = function () {
            var left = this.multiplicative()
            while (this.peek('+', '-')) {
              var op = this.consume()
              left = new OperatorNode(op.value, [left, this.multiplicative()])
            }
            return left
          }
          Parser.prototype.multiplicative = function () {
            var op, right
            var left = this.unary()
            while (this.peek('*', '/', '%')) {
              op = this.consume()
              left = new OperatorNode(op.value, [left, this.unary()])
            }
            if (
              this.current().type === tokenType.SYMBOL ||
              this.peek('(') ||
              (!(left.type instanceof ConstantNode) &&
                this.current().type === tokenType.NUMBER)
            ) {
              right = this.multiplicative()
              return new OperatorNode('*', [left, right])
            }
            return left
          }
          Parser.prototype.unary = function () {
            if (this.peek('-', '+', '~')) {
              var op = this.consume()
              var right = this.unary()
              return new UnaryNode(op.value, right)
            }
            return this.pow()
          }
          Parser.prototype.pow = function () {
            var left = this.factorial()
            if (this.peek('^', '**')) {
              var op = this.consume()
              var right = this.unary()
              return new OperatorNode(op.value, [left, right])
            }
            return left
          }
          Parser.prototype.factorial = function () {
            var left = this.symbol()
            if (this.peek('!')) {
              var op = this.consume()
              return new OperatorNode(op.value, [left])
            }
            return left
          }
          Parser.prototype.symbol = function () {
            var current = this.current()
            if (current.type === tokenType.SYMBOL) {
              var symbol = this.consume()
              var node = this.functionCall(symbol)
              return node
            }
            return this.string()
          }
          Parser.prototype.functionCall = function (symbolToken) {
            var name = symbolToken.value
            if (this.peek('(')) {
              this.consume()
              var params = []
              while (!this.peek(')') && !this.isEOF()) {
                params.push(this.assignment())
                if (this.peek(',')) {
                  this.consume()
                }
              }
              this.expect(')')
              return new FunctionNode(name, params)
            }
            return new SymbolNode(name)
          }
          Parser.prototype.string = function () {
            if (this.current().type === tokenType.STRING) {
              return new ConstantNode(this.consume().value, 'string')
            }
            return this.array()
          }
          Parser.prototype.array = function () {
            if (this.peek('[')) {
              this.consume()
              var params = []
              while (!this.peek(']') && !this.isEOF()) {
                params.push(this.assignment())
                if (this.peek(',')) {
                  this.consume()
                }
              }
              this.expect(']')
              return new ArrayNode(params)
            }
            return this.number()
          }
          Parser.prototype.number = function () {
            var token = this.current()
            if (token.type === tokenType.NUMBER) {
              return new ConstantNode(this.consume().value, 'number')
            }
            return this.parentheses()
          }
          Parser.prototype.parentheses = function () {
            var token = this.current()
            if (token.value === '(') {
              this.consume()
              var left = this.assignment()
              this.expect(')')
              return left
            }
            return this.end()
          }
          Parser.prototype.end = function () {
            var token = this.current()
            if (token.type !== tokenType.EOF) {
              throw Error('unexpected end of expression')
            }
          }
          module.exports = Parser
        },
        {
          './Lexer': 74,
          './node/ArrayNode': 76,
          './node/AssignmentNode': 77,
          './node/BlockNode': 78,
          './node/ConditionalNode': 79,
          './node/ConstantNode': 80,
          './node/FunctionNode': 81,
          './node/OperatorNode': 83,
          './node/SymbolNode': 84,
          './node/UnaryNode': 85,
          './token-type': 87
        }
      ],
      76: [
        function (require, module, exports) {
          var Node = require('./Node')
          function ArrayNode (nodes) {
            this.nodes = nodes
          }
          ArrayNode.prototype = Object.create(Node.prototype)
          ArrayNode.prototype.type = 'ArrayNode'
          module.exports = ArrayNode
        },
        { './Node': 82 }
      ],
      77: [
        function (require, module, exports) {
          var Node = require('./Node')
          function AssignmentNode (name, expr) {
            this.name = name
            this.expr = expr
          }
          AssignmentNode.prototype = Object.create(Node.prototype)
          AssignmentNode.prototype.type = 'AssignmentNode'
          module.exports = AssignmentNode
        },
        { './Node': 82 }
      ],
      78: [
        function (require, module, exports) {
          var Node = require('./Node')
          function BlockNode (blocks) {
            this.blocks = blocks
          }
          BlockNode.prototype = Object.create(Node.prototype)
          BlockNode.prototype.type = 'BlockNode'
          module.exports = BlockNode
        },
        { './Node': 82 }
      ],
      79: [
        function (require, module, exports) {
          var Node = require('./Node')
          function ConditionalNode (predicate, truthy, falsy) {
            this.condition = predicate
            this.trueExpr = truthy
            this.falseExpr = falsy
          }
          ConditionalNode.prototype = Object.create(Node.prototype)
          ConditionalNode.prototype.type = 'ConditionalNode'
          module.exports = ConditionalNode
        },
        { './Node': 82 }
      ],
      80: [
        function (require, module, exports) {
          var Node = require('./Node')
          var SUPPORTED_TYPES = {
            number: true,
            string: true,
            boolean: true,
            undefined: true,
            null: true
          }
          function ConstantNode (value, type) {
            if (!SUPPORTED_TYPES[type]) {
              throw Error("unsupported type '" + type + "'")
            }
            this.value = value
            this.valueType = type
          }
          ConstantNode.prototype = Object.create(Node.prototype)
          ConstantNode.prototype.type = 'ConstantNode'
          module.exports = ConstantNode
        },
        { './Node': 82 }
      ],
      81: [
        function (require, module, exports) {
          var Node = require('./Node')
          function FunctionNode (name, args) {
            this.name = name
            this.args = args
          }
          FunctionNode.prototype = Object.create(Node.prototype)
          FunctionNode.prototype.type = 'FunctionNode'
          module.exports = FunctionNode
        },
        { './Node': 82 }
      ],
      82: [
        function (require, module, exports) {
          function Node () {}
          Node.prototype.type = 'Node'
          module.exports = Node
        },
        {}
      ],
      83: [
        function (require, module, exports) {
          var Node = require('./Node')
          function OperatorNode (op, args) {
            this.op = op
            this.args = args || []
          }
          OperatorNode.prototype = Object.create(Node.prototype)
          OperatorNode.prototype.type = 'OperatorNode'
          module.exports = OperatorNode
        },
        { './Node': 82 }
      ],
      84: [
        function (require, module, exports) {
          var Node = require('./Node')
          function SymbolNode (name) {
            this.name = name
          }
          SymbolNode.prototype = Object.create(Node.prototype)
          SymbolNode.prototype.type = 'SymbolNode'
          module.exports = SymbolNode
        },
        { './Node': 82 }
      ],
      85: [
        function (require, module, exports) {
          var Node = require('./Node')
          function UnaryNode (op, argument) {
            this.op = op
            this.argument = argument
          }
          UnaryNode.prototype = Object.create(Node.prototype)
          UnaryNode.prototype.type = 'UnaryNode'
          module.exports = UnaryNode
        },
        { './Node': 82 }
      ],
      86: [
        function (require, module, exports) {
          module.exports = {
            ArrayNode: require('./ArrayNode'),
            AssignmentNode: require('./AssignmentNode'),
            BlockNode: require('./BlockNode'),
            ConditionalNode: require('./ConditionalNode'),
            ConstantNode: require('./ConstantNode'),
            FunctionNode: require('./FunctionNode'),
            Node: require('./Node'),
            OperatorNode: require('./OperatorNode'),
            SymbolNode: require('./SymbolNode'),
            UnaryNode: require('./UnaryNode')
          }
        },
        {
          './ArrayNode': 76,
          './AssignmentNode': 77,
          './BlockNode': 78,
          './ConditionalNode': 79,
          './ConstantNode': 80,
          './FunctionNode': 81,
          './Node': 82,
          './OperatorNode': 83,
          './SymbolNode': 84,
          './UnaryNode': 85
        }
      ],
      87: [
        function (require, module, exports) {
          module.exports = {
            EOF: 0,
            DELIMITER: 1,
            NUMBER: 2,
            STRING: 3,
            SYMBOL: 4
          }
        },
        {}
      ],
      88: [
        function (require, module, exports) {
          'use strict'
          var doubleBits = require('double-bits')
          var SMALLEST_DENORM = Math.pow(2, -1074)
          var UINT_MAX = -1 >>> 0
          module.exports = nextafter
          function nextafter (x, y) {
            if (isNaN(x) || isNaN(y)) {
              return NaN
            }
            if (x === y) {
              return x
            }
            if (x === 0) {
              if (y < 0) {
                return -SMALLEST_DENORM
              } else {
                return SMALLEST_DENORM
              }
            }
            var hi = doubleBits.hi(x)
            var lo = doubleBits.lo(x)
            if (y > x === x > 0) {
              if (lo === UINT_MAX) {
                hi += 1
                lo = 0
              } else {
                lo += 1
              }
            } else {
              if (lo === 0) {
                lo = UINT_MAX
                hi -= 1
              } else {
                lo -= 1
              }
            }
            return doubleBits.pack(lo, hi)
          }
        },
        { 'double-bits': 30 }
      ],
      89: [
        function (require, module, exports) {
          var process = (module.exports = {})
          var cachedSetTimeout
          var cachedClearTimeout
          function defaultSetTimout () {
            throw new Error('setTimeout has not been defined')
          }
          function defaultClearTimeout () {
            throw new Error('clearTimeout has not been defined')
          }
          ;(function () {
            try {
              if (typeof setTimeout === 'function') {
                cachedSetTimeout = setTimeout
              } else {
                cachedSetTimeout = defaultSetTimout
              }
            } catch (e) {
              cachedSetTimeout = defaultSetTimout
            }
            try {
              if (typeof clearTimeout === 'function') {
                cachedClearTimeout = clearTimeout
              } else {
                cachedClearTimeout = defaultClearTimeout
              }
            } catch (e) {
              cachedClearTimeout = defaultClearTimeout
            }
          })()
          function runTimeout (fun) {
            if (cachedSetTimeout === setTimeout) {
              return setTimeout(fun, 0)
            }
            if (
              (cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) &&
              setTimeout
            ) {
              cachedSetTimeout = setTimeout
              return setTimeout(fun, 0)
            }
            try {
              return cachedSetTimeout(fun, 0)
            } catch (e) {
              try {
                return cachedSetTimeout.call(null, fun, 0)
              } catch (e) {
                return cachedSetTimeout.call(this, fun, 0)
              }
            }
          }
          function runClearTimeout (marker) {
            if (cachedClearTimeout === clearTimeout) {
              return clearTimeout(marker)
            }
            if (
              (cachedClearTimeout === defaultClearTimeout ||
                !cachedClearTimeout) &&
              clearTimeout
            ) {
              cachedClearTimeout = clearTimeout
              return clearTimeout(marker)
            }
            try {
              return cachedClearTimeout(marker)
            } catch (e) {
              try {
                return cachedClearTimeout.call(null, marker)
              } catch (e) {
                return cachedClearTimeout.call(this, marker)
              }
            }
          }
          var queue = []
          var draining = false
          var currentQueue
          var queueIndex = -1
          function cleanUpNextTick () {
            if (!draining || !currentQueue) {
              return
            }
            draining = false
            if (currentQueue.length) {
              queue = currentQueue.concat(queue)
            } else {
              queueIndex = -1
            }
            if (queue.length) {
              drainQueue()
            }
          }
          function drainQueue () {
            if (draining) {
              return
            }
            var timeout = runTimeout(cleanUpNextTick)
            draining = true
            var len = queue.length
            while (len) {
              currentQueue = queue
              queue = []
              while (++queueIndex < len) {
                if (currentQueue) {
                  currentQueue[queueIndex].run()
                }
              }
              queueIndex = -1
              len = queue.length
            }
            currentQueue = null
            draining = false
            runClearTimeout(timeout)
          }
          process.nextTick = function (fun) {
            var args = new Array(arguments.length - 1)
            if (arguments.length > 1) {
              for (var i = 1; i < arguments.length; i++) {
                args[i - 1] = arguments[i]
              }
            }
            queue.push(new Item(fun, args))
            if (queue.length === 1 && !draining) {
              runTimeout(drainQueue)
            }
          }
          function Item (fun, array) {
            this.fun = fun
            this.array = array
          }
          Item.prototype.run = function () {
            this.fun.apply(null, this.array)
          }
          process.title = 'browser'
          process.browser = true
          process.env = {}
          process.argv = []
          process.version = ''
          process.versions = {}
          function noop () {}
          process.on = noop
          process.addListener = noop
          process.once = noop
          process.off = noop
          process.removeListener = noop
          process.removeAllListeners = noop
          process.emit = noop
          process.binding = function (name) {
            throw new Error('process.binding is not supported')
          }
          process.cwd = function () {
            return '/'
          }
          process.chdir = function (dir) {
            throw new Error('process.chdir is not supported')
          }
          process.umask = function () {
            return 0
          }
        },
        {}
      ],
      90: [
        function (require, module, exports) {
          var ua =
              typeof window !== 'undefined' ? window.navigator.userAgent : '',
            isOSX = /OS X/.test(ua),
            isOpera = /Opera/.test(ua),
            maybeFirefox = !/like Gecko/.test(ua) && !isOpera
          var i,
            output = (module.exports = {
              0: isOSX ? '<menu>' : '<UNK>',
              1: '<mouse 1>',
              2: '<mouse 2>',
              3: '<break>',
              4: '<mouse 3>',
              5: '<mouse 4>',
              6: '<mouse 5>',
              8: '<backspace>',
              9: '<tab>',
              12: '<clear>',
              13: '<enter>',
              16: '<shift>',
              17: '<control>',
              18: '<alt>',
              19: '<pause>',
              20: '<caps-lock>',
              21: '<ime-hangul>',
              23: '<ime-junja>',
              24: '<ime-final>',
              25: '<ime-kanji>',
              27: '<escape>',
              28: '<ime-convert>',
              29: '<ime-nonconvert>',
              30: '<ime-accept>',
              31: '<ime-mode-change>',
              27: '<escape>',
              32: '<space>',
              33: '<page-up>',
              34: '<page-down>',
              35: '<end>',
              36: '<home>',
              37: '<left>',
              38: '<up>',
              39: '<right>',
              40: '<down>',
              41: '<select>',
              42: '<print>',
              43: '<execute>',
              44: '<snapshot>',
              45: '<insert>',
              46: '<delete>',
              47: '<help>',
              91: '<meta>',
              92: '<meta>',
              93: isOSX ? '<meta>' : '<menu>',
              95: '<sleep>',
              106: '<num-*>',
              107: '<num-+>',
              108: '<num-enter>',
              109: '<num-->',
              110: '<num-.>',
              111: '<num-/>',
              144: '<num-lock>',
              145: '<scroll-lock>',
              160: '<shift-left>',
              161: '<shift-right>',
              162: '<control-left>',
              163: '<control-right>',
              164: '<alt-left>',
              165: '<alt-right>',
              166: '<browser-back>',
              167: '<browser-forward>',
              168: '<browser-refresh>',
              169: '<browser-stop>',
              170: '<browser-search>',
              171: '<browser-favorites>',
              172: '<browser-home>',
              173: isOSX && maybeFirefox ? '-' : '<volume-mute>',
              174: '<volume-down>',
              175: '<volume-up>',
              176: '<next-track>',
              177: '<prev-track>',
              178: '<stop>',
              179: '<play-pause>',
              180: '<launch-mail>',
              181: '<launch-media-select>',
              182: '<launch-app 1>',
              183: '<launch-app 2>',
              186: ';',
              187: '=',
              188: ',',
              189: '-',
              190: '.',
              191: '/',
              192: '`',
              219: '[',
              220: '\\',
              221: ']',
              222: "'",
              223: '<meta>',
              224: '<meta>',
              226: '<alt-gr>',
              229: '<ime-process>',
              231: isOpera ? '`' : '<unicode>',
              246: '<attention>',
              247: '<crsel>',
              248: '<exsel>',
              249: '<erase-eof>',
              250: '<play>',
              251: '<zoom>',
              252: '<no-name>',
              253: '<pa-1>',
              254: '<clear>'
            })
          for (i = 58; i < 65; ++i) {
            output[i] = String.fromCharCode(i)
          }
          for (i = 48; i < 58; ++i) {
            output[i] = i - 48 + ''
          }
          for (i = 65; i < 91; ++i) {
            output[i] = String.fromCharCode(i)
          }
          for (i = 96; i < 106; ++i) {
            output[i] = '<num-' + (i - 96) + '>'
          }
          for (i = 112; i < 136; ++i) {
            output[i] = 'F' + (i - 111)
          }
        },
        {}
      ],
      91: [
        function (require, module, exports) {
          module.exports = extend
          var hasOwnProperty = Object.prototype.hasOwnProperty
          function extend (target) {
            for (var i = 1; i < arguments.length; i++) {
              var source = arguments[i]
              for (var key in source) {
                if (hasOwnProperty.call(source, key)) {
                  target[key] = source[key]
                }
              }
            }
            return target
          }
        },
        {}
      ]
    },
    {},
    [1]
  )(1)
})
