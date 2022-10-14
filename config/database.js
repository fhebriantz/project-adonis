'use strict'

/** @type {import('@adonisjs/framework/src/Env')} */
const Env = use('Env')

/** @type {import('@adonisjs/ignitor/src/Helpers')} */
const Helpers = use('Helpers')

module.exports = {
  /*
  |--------------------------------------------------------------------------
  | Default Connection
  |--------------------------------------------------------------------------
  |
  | Connection defines the default connection settings to be used while
  | interacting with SQL databases.
  |
  */
  connection: Env.get('DB_CONNECTION', 'pg'),

  /*
  |--------------------------------------------------------------------------
  | Sqlite
  |--------------------------------------------------------------------------
  |
  | Sqlite is a flat file database and can be good choice under development
  | environment.
  |
  | npm i --save sqlite3
  |
  */
  sqlite: {
    client: 'sqlite3',
    connection: {
      filename: Helpers.databasePath(`${Env.get('DB_DATABASE', 'development')}.sqlite`)
    },
    useNullAsDefault: true
  },

  /*
  |--------------------------------------------------------------------------
  | MySQL
  |--------------------------------------------------------------------------
  |
  | Here we define connection settings for MySQL database.
  |
  | npm i --save mysql
  |
  */
  mysql: {
    client: 'mysql',
    connection: {
      host: Env.get('DB_HOST', 'localhost'),
      port: Env.get('DB_PORT', ''),
      user: Env.get('DB_USER', 'root'),
      password: Env.get('DB_PASSWORD', ''),
      database: Env.get('DB_DATABASE', 'adonis')
    }
  },

  /*
  |--------------------------------------------------------------------------
  | PostgreSQL
  |--------------------------------------------------------------------------
  |
  | Here we define connection settings for PostgreSQL database.
  |
  | npm i --save pg
  |
  */
  pg: {
    client: 'pg',
    connection: {
      host: Env.get('DB_HOST', 'localhost'),
      port: Env.get('DB_PORT', ''),
      user: Env.get('DB_USER', 'root'),
      password: Env.get('DB_PASSWORD', ''),
      database: Env.get('DB_DATABASE', 'adonis')
    }
  },
  pg_kmf: {  //Connection For KOMINFO
    client: 'pg',
    connection: {
      host: Env.get('DB_HOST_KMF', 'localhost'),
      port: Env.get('DB_PORT_KMF', ''),
      user: Env.get('DB_USER_KMF', 'root'),
      password: Env.get('DB_PASSWORD_KMF', ''),
      database: Env.get('DB_DATABASE_KMF', 'adonis')
    }
  },
  pg_connecta: {
    client: 'pg',
    connection: {
      host: Env.get('DB_HOST_CONNECTA', 'localhost'),
      port: Env.get('DB_PORT_CONNECTA', ''),
      user: Env.get('DB_USER_CONNECTA', 'root'),
      password: Env.get('DB_PASSWORD_CONNECTA', ''),
      database: Env.get('DB_DATABASE_CONNECTA', 'adonis'),
      application_name: 'adonis',
      connectionTimeoutMillis: 10 * 60 * 1000,
      idleTimeoutMillis: 10 * 60 * 1000,
      statement_timeout: 9 * 60 * 1000
    },
    searchPath: [Env.get('PG_SCHEMA', 'public'), 'public'],
    pool: { min: 1, max: 200 },
    acquireConnectionTimeout: 10000
  }
}
