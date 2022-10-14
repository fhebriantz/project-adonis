"use strict";
const debug = require("debug")("controller:user");
const Database = use("Database");
const Env = use("Env");
const User = use("App/Models/User");
const Config = use("Config");
const Hash = use("Hash");
const moment = require("moment");
const { validate } = use("Validator");
const CryptoJS = require("crypto-js");

class UserController {
  async addUser({ auth, params, request, response }) {
    debug(params.ctxid, "-> addUser", request.originalUrl());

    let { username, email, password, role } = request.all();

    const rules = {
      username: "required",
      email: "required|email|unique:cms.t_mtr_user,email",
      password: "required",
      role: "required",
    };

    const validation = await validate(request.all(), rules);

    if (validation.fails()) {
      response.status(400);
      return validation.messages();
    }

    let user = username.toLowerCase();
    email = email.toLowerCase();
    const pass = await Hash.make(password);

    try {
      await Database.select(
        Database.raw(
          ` from  "cms"."f_app_user_add"('${user}', '${pass}', '${email}', '${auth.user.username}', '${role}')`
        )
        // .raw(`* FROM cms.sp_registration ('${user}', '${pass}', '${email}', 'Myself', '${_now}', array ['${role}'],1)`)
      );

      return {
        message: "Register Successfully",
        user: user,
        email: email,
        role: role
      };
    } catch (error) {
      console.log(error);
      if (error.code == "23505") {
        response.status(409);
        return {
          message: `Username '${user}' or Email '${email}' already exist`,
        };
      } else {
        response.status(500);
      }
    }
  }

  async updateUser({ auth, params, request, response }) {
    debug(params.ctxid, "-> updateUser", request.originalUrl());

    let { id_user, username, email, password, role } = request.all();

    const rules = {
      id_user: "required",
      username: "required",
      email: "required",
      role: "required",
    };

    const validation = await validate(request.all(), rules);

    if (validation.fails()) {
      response.status(400);
      return validation.messages();
    }

    let user = username.toLowerCase();
    email = email.toLowerCase();
    let pass
    if (password == null || password == undefined || password == '') {
      pass = ''
    } else {
      pass = await Hash.make(password);
    }

    try {
      await Database.select(
        Database.raw(
          ` from  "cms"."f_app_user_update"('${id_user}','${user}', '${pass}', '${email}', '${auth.user.username}', '${role}')`
        )
        // .raw(`* FROM cms.sp_registration ('${user}', '${pass}', '${email}', 'Myself', '${_now}', array ['${role}'],1)`)
      );

      return {
        message: "Update Successfully",
        user: user,
        email: email,
        role: role,
      };
    } catch (error) {
      console.log(error);
      if (error.code == "23505") {
        response.status(409);
        return {
          message: `Username '${user}' or Email '${email}' already exist`,
        };
      } else {
        response.status(500);
      }
    }
  }

  async deleteUser({ params, request, response }) {
    debug(params.ctxid, "-> deleteUser", request.originalUrl());

    let { id_user } = request.all();

    const rules = {
      id_user: "required"
    };

    const validation = await validate(request.all(), rules);

    if (validation.fails()) {
      response.status(400);
      return validation.messages();
    }

    await Database.select(
      Database.raw(
        ` from  "cms"."f_app_user_delete"('${id_user}')`
      )
      // .raw(`* FROM cms.sp_registration ('${user}', '${pass}', '${email}', 'Myself', '${_now}', array ['${role}'],1)`)
    );

    return {
      message: "Delete Successfully"
    };

  }

  async listUser({ params, request, response }) {
    debug(params.ctxid, "-> listUser", request.originalUrl());

    const result = await Database.raw(`select * from "cms"."f_app_user_list"();`);

    return result.rows

  }

  async login({ auth, request, params, response }) {
    const { payload } = request.all();
    var bytes = CryptoJS.AES.decrypt(payload, process.env.SECRET_CRYPTO);
    var originalText = bytes.toString(CryptoJS.enc.Utf8);
    let data = await JSON.parse(originalText);

    let userLogin = data.email;
    userLogin = userLogin.toLowerCase();
    if (request.format() === "json") {
      const uid = Config.get("auth")[Config.get("auth.authenticator")].uid;
      const checkuser = await User.findBy(uid, data.email);
      if (!checkuser) {
        response.status(400);
        return {
          message: "email is does not exist",
        };
      }

      // if (checkuser.rows[0].is_login === true) {
      //   response.status(400)
      //   return {
      //     message: 'user already login, please logout from previous browser!'
      //   }
      // }

      const result = await auth
        .authenticator("jwt")
        .attempt(userLogin, data.password, true);

      let loginUser = await Database.from("cms.t_mtr_user").where(
        uid,
        userLogin
      );
      let dataUser = loginUser[0];

      let user = {
        username: dataUser.username,
        email: dataUser.email,
        role: dataUser.role_type,
        org: dataUser.organization_name_var,
      };
      result.user = user;
      result.linkToken = Env.get("APP_KEY"); // 'E8bq072cMf8t2aJ2W2hWQTPT0r7PwFIu'

      await User.query().where("email", userLogin).update({ is_login: true });

      return result;
    }
  }

  async changePassword({ auth, request, response }) {
    let { payload } = request.all();
    var bytes = CryptoJS.AES.decrypt(payload, process.env.SECRET_CRYPTO);
    var originalText = bytes.toString(CryptoJS.enc.Utf8);
    let data = JSON.parse(originalText);
    const pass = await Hash.make(data.newPassword);

    const rules = {
      payload: "required",
    };

    const validation = await validate(request.all(), rules);
    if (validation.fails()) {
      response.status(400);
      return validation.messages();
    }

    if (auth.user.email) {
      try {
        await auth.attempt(auth.user.email, data.password);
        await Database.raw(
          `SELECT * FROM "cms"."sp_change_password" ('${auth.user.email}', '${pass}')`
        );
        return { message: "Change password success!" };
      } catch (error) {
        response.status(400);
        return { message: "Old password not match!" };
      }
    }
  }

  async logout({ auth, request, response }) {
    let { email } = request.all();
    try {
      await User.query().where("email", email).update({ is_login: false });

      return response.redirect("/login");
    } catch (error) {
      response.status(500);
    }
  }

  async pingtest({ auth, request, response }) {
    let { provider, city, data, device_id, license } = request.all();

    const rules = {
      provider: "required",
      city: "required",
      data: "required",
      device_id: "required",
      license: "required"
    };

    const validation = await validate(request.all(), rules);

    if (validation.fails()) {
      response.status(400);
      return validation.messages();
    }
    
    const check_license = await Database.raw(`select * from netsight_info.license where device_id = '${device_id}' and license = '${license}'`)
    if (check_license.rows.length == 0) {
      response.status(400)
      await Database.raw(`select from "netsight_log"."f_insert_device_log"('${provider}','${city}','${data.datetime}', '${device_id}', 'pingtest', 'error', 'Device_ID and License does not match!')`)
      return { message: 'Device_ID and License does not match!'}
    }

    try {
      
      await Database.raw(`select from "netsight_ping"."f_insert_raw_data_pingtest"('${provider}', '${city}', '${data.datetime}', '${data.source}', '${data.host}', '${data.avg}', '${data.max}', '${data.min}', '${data.loss}')`)
      await Database.raw(`select from "netsight_log"."f_insert_device_log"('${provider}','${city}','${data.datetime}', '${device_id}', 'pingtest', 'success', '{"provider": "${provider}","city":"${city}", "source":"${data.source}", "host":"${data.host}", "avg":"${data.avg}", "max":"${data.max}", "min":"${data.min}", "loss":"${data.loss}"}')`)
      return {
        message: 'success insert'
      }
    } catch (error) {
      response.status(400);
      await Database.raw(`select from "netsight_log"."f_insert_device_log"('${provider}','${city}','${data.datetime}', '${device_id}', 'pingtest', 'error', 'Failed to insert')`)
      return {
        message: 'failed to insert'
      }
    }
  }

  async temperature({ auth, request, response }) {
    let { provider, city, data, device_id, license } = request.all();

    const rules = {
      provider: "required",
      city: "required",
      data: "required",
      device_id: "required",
      license: "required"
    };

    const validation = await validate(request.all(), rules);

    if (validation.fails()) {
      response.status(400);
      return validation.messages();
    }
    
    const check_license = await Database.raw(`select * from netsight_info.license where device_id = '${device_id}' and license = '${license}'`)
    if (check_license.rows.length == 0) {
      response.status(400)
      await Database.raw(`select from "netsight_log"."f_insert_device_log"('${provider}','${city}','${data.datetime}', '${device_id}', 'temperature', 'error', 'Device_ID and License does not match!')`)
      return { message: 'Device_ID and License does not match!'}
    }
    
    try {
      
      await Database.raw(`select from "netsight_temperature"."f_insert_data_temperature"('${provider}', '${city}', '${device_id}', '${data.datetime}', '${data.source}', '${data.temp}')`)
      await Database.raw(`select from "netsight_log"."f_insert_device_log"('${provider}','${city}','${data.datetime}', '${device_id}', 'temperature', 'success', '{"provider": "${provider}","city":"${city}", "source":"${data.source}", "temp":"${data.temp}"}')`)
      return {
        message: 'success insert'
      }
    } catch (error) {
      response.status(400);
      await Database.raw(`select from "netsight_log"."f_insert_device_log"('${provider}','${city}','${data.datetime}', '${device_id}', 'temperature', 'error', 'Failed to insert')`)
      return {
        message: 'failed to insert'
      }
    }
  }
}

module.exports = UserController;
