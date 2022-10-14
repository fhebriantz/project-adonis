"use strict";
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

class UserOrganization {
  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Function} next
   */
  async handle({ request }, next) {
    // call next to advance the request
    request.version = "_v2";
    request.conn = "pg";
    request.zerotier = {
      token: "mfk5CsH6L2HV8BT9QD4UTYFjpZDkbAkW",
      network: "233ccaac27364dc8",
    };

    await next();
  }
}

module.exports = UserOrganization;
