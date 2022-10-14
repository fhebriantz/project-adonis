'use strict'

const debug = require('debug')('middleware:param')
const _ = require('lodash')
const inflection = require('inflection')
const { v4: uuidv4 } = require('uuid');

module.exports = class ParamMiddleware {
  async handle(ctx, next) {
    ctx.params.ctxid = uuidv4()

    await this.handleUpStream(ctx)

    await next()

    await this.handleDownStream(ctx)
  }

  async handleUpStream({ request, response, params }) {
    debug('%s -> handleUpStream %O', params.ctxid, request.originalUrl())

    const qs = { ...request.get() }
    // for (const q in qs) {
    // if (q === inflection.pluralize(q)) {
    // // singular not exist
    // if (!qs[inflection.singularize(q)]) qs[inflection.singularize(q)] = qs[q]

    // // check array
    // if (!Array.isArray(qs[q])) qs[q] = qs[q].split(',')
    // } else {
    // // plural not exist
    // if (!qs[inflection.pluralize(q)]) qs[inflection.pluralize(q)] = Array.isArray(qs[q]) ? qs[q] : qs[q].split(',')

    // // check array
    // if (Array.isArray(qs[q])) qs[q] = qs[q].join(',')
    // }
    // }

    const prms = { ...params, ...request.all() }

    // aware snakeCase properties
    request.all = () => {
      // camelCase properties
      for (const key in prms) {
        const ckey = _.camelCase(key)
        if (!prms[ckey]) prms[ckey] = prms[key]
      }

      // generalized date
      if (!prms.dateStart) prms.dateStart = prms.startDate || (new Date()).toJSON().split('T')[0]
      if (!prms.dateEnd) prms.dateEnd = prms.endDate || (new Date(Date.now() + 86400000)).toJSON().split('T')[0]

      if (prms.dataLoc) prms.location = prms.dataLoc
      if (prms.city) prms.location = prms.city
      // if (prms.kpi) prms.unit = prms.kpi
      if (prms.node) prms.probe = prms.node

      return prms
    }

    // handle multipart field
    const { multipart } = request
    if (multipart) {
      await multipart.field((name, value) => {
        prms[name] = value
      })
    }

    debug('%s handleUpStream -> %O', params.ctxid, params)
  }

  async handleDownStream({ request, response, params, view }) {
    debug('%s -> handleDownStream %O', params.ctxid, request.originalUrl())

    const { lazyBody: { content } } = response

    debug('%s handleDownStream -> %O', params.ctxid, content)

    const ext = request.format() || ''
    if (ext.indexOf('json') > -1) return response.json(content)
    if (ext.indexOf('htm') > -1) return response.send(view.render('plain', { jsonSource: JSON.stringify(content) }))
  }
}
