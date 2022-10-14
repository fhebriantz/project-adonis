'use strict'

const debug = require('debug')('middleware:cache')
const hash = require('object-hash')
const Config = use('Config')
const Cache = use('Cache')

module.exports = class CacheMiddleware {
  async handle(ctx, next) {
    await this.handleUpStream(ctx)

    await next()

    await this.handleDownStream(ctx)
  }

  cacheKey({ request, params }) {
    const { hkey } = params
    if (hkey) return hkey

    const queries = Object.entries(request.except(['csrf_token', 'submit', 'k', 'e', 'refresh']))
      .sort(([, v1], [, v2]) => +v2 - +v1)
      .reduce((r, [k, v]) => ({ ...r, [k]: v }), {})

    // remove format eg: json
    const format = request.format()
    const url = !format ? request.url() : request.url().replace(`.${format}`, '')

    // get key
    return hash({ url, queries })
  }

  async handleUpStream({ request, response, params, view }) {
    debug('%s -> handleUpStream %O', params.ctxid, request.originalUrl())

    // get key
    const key = this.cacheKey({ request, params })

    // temporary
    params.cache = { key, minutes: Config.get('cache.minutes', 10) }

    // force cache
    if (params.refresh) {
      debug('%s -> refresh %O', params.ctxid, params)

      Cache.forget(key)

      debug('%s refresh -> %O', params.ctxid, params)
      return
    }

    // get cache
    const content = await Cache.get(key)

    if (content) {
      debug('%s -> send %O', params.ctxid, content)

      // immediate response
      response.implicitEnd = false

      debug('%s send -> %O', params.ctxid, content)

      const ext = request.format() || ''

      if (ext.indexOf('json') > -1) return response.json(content) // .end()
      if (ext.indexOf('htm') > -1) return response.send(view.render('plain', { jsonSource: JSON.stringify(content) })) // .end()
    }

    debug('%s -> handleUpStream %O', params.ctxid, params)
  }

  async handleDownStream({ request, response, params, view }) {
    debug('%s -> handleDownStream %O', params.ctxid, request.originalUrl())

    // write cache
    if (request.format() === 'json') {
      response.response.once('finish', async () => {
        debug('%s -> writeCache %O', params.ctxid, request.originalUrl())

        const key = this.cacheKey({ request, params })
        const { lazyBody: { content }, response: { statusCode } } = response

        // write to cache
        if (statusCode === 200) await Cache.add(key, content, Config.get('cache.minutes', 10))

        debug('%s writeCache -> %O', params.ctxid, content)
      })
    }

    debug('%s handleDownStream -> %O', params.ctxid, params)
  }
}
