"use strict";

const Task = use("Task");
const Database = use("Database");
const nodemailer = require("nodemailer");
const { Telegraf } = require("telegraf");
const moment = require("moment");
const bot = new Telegraf(process.env.BOT_TOKEN);

const notifTelegram = async (notifications) => {
  // bot.start((ctx) => ctx.reply('Welcome to Alert and Notification Bot!'))
  notifications.map((el) => {
    bot.telegram.sendMessage(process.env.CHAT_ID, el.notification);
  });
  bot.startPolling();
  console.log("Telegram bot started.");
};

const notification = async (notifications) => {
  let msg = ``;
  notifications.map((el, i) => {
    msg += `${i + 1}. ${el.notification}\n`;
  });

  const mail = nodemailer.createTransport({
    host: "exch01.immobisp.com",
    port: 587,
    secure: false, // upgrade later with STARTTLS
    auth: {
      user: "jiraimm@immobisp.com",
      pass: "Immsp@2021!",
    },
    tls: {
      rejectUnauthorized: false,
      minVersion: "TLSv1.2",
    },
  });

  try {
    let emails = await Database.raw(
      `select * from "netsight_info"."f_app_list_email"()`
    );
    const now = new Date();
    const _now = moment(now).tz("Asia/Jakarta").format("YYYY-MM-DD HH:mm");
    const mailOptions = {
      from: "jiraimm@immobisp.com",
      to: "netsight.helpdesk@gmail.com", //tujuan
      cc: emails.rows[0].list_email, //bcc
      subject: `Netsight Alert - ${_now}`,
      text: msg, //Pesan
    };

    mail.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Your email was successfully sent");
      }
    });
  } catch (error) {
    console.log(error);
  }
};

class Notification extends Task {
  static get schedule() {
    return "15 * * * *";
  }

  async handle() {
    let status = await Database.connection("pg_kmf").raw(
      `select * from "netsight_report"."f_app_alert_notif_status"();`
    );
    if (status.rows[0].status === 1) {
      let notif = await Database.connection("pg_kmf").raw(
        `select * from "netsight_report"."f_app_alert_notif_notification"()`
      );
      notifTelegram(notif.rows);
      notification(notif.rows);
    }
  }
}

module.exports = Notification;
