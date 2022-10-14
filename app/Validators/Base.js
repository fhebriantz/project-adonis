'use strict'

const debug = require('debug')('validator:base')
const { camelCase } = require('lodash')
// const { LogicalException } = require('@adonisjs/generic-exceptions')
const Config = use('Config')

module.exports = class BaseValidator {
  get data() {
    const { request, params } = this.ctx
    debug(params.ctxid, '-> data', request.originalUrl())

    for (const data of [request.get(), request.post()]) {
      Object.keys(data).forEach(key => {
        params[key] = data[key]
        params[camelCase(key)] = data[key]
      })
    }

    debug(params.ctxid, 'data ->', JSON.stringify(params).substr(0, 100))
    return this.ctx.params
  }

  get messages() {
    const { request, params } = this.ctx
    debug(params.ctxid, '-> messages', request.originalUrl())

    debug(params.ctxid, 'messages ->', typeof params)
    return Config.get('validators.messages')
  }

  async fails(errorMessages) {
    const { request, response, params } = this.ctx
    debug(params.ctxid, '-> fails ->', request.originalUrl())

    const { 0: { message: errorMessage, validation } } = errorMessages
    const httpStatus = Config.get(`validators.httpStatus.${validation}`, 500)
    const message = httpStatus === 500 ? 'Unknown error' : errorMessage

    response.implicitEnd = false

    debug(params.ctxid, 'fails ->', httpStatus)
    return response.status(httpStatus).json({ error: httpStatus, message })
  }
}
