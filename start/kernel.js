'use strict'

/** @type {import('@adonisjs/framework/src/Server')} */
const Server = use('Server')

/*
|--------------------------------------------------------------------------
| Global Middleware
|--------------------------------------------------------------------------
|
| Global middleware are executed on each http request only when the routes
| match.
|
*/
const globalMiddleware = [
  'Adonis/Middleware/BodyParser',
  'Adonis/Middleware/Session',
  'Adonis/Middleware/Shield',
  'Adonis/Middleware/AuthInit',
  'App/Middleware/ConvertEmptyStringsToNull',
  'App/Middleware/Param'
]

/*
|--------------------------------------------------------------------------
| Named Middleware
|--------------------------------------------------------------------------
|
| Named middleware is key/value object to conditionally add middleware on
| specific routes or group of routes.
|
| // define
| {
|   auth: 'Adonis/Middleware/Auth'
| }
|
| // use
| Route.get().middleware('auth')
|
*/
const namedMiddleware = {
  auth: 'Adonis/Middleware/Auth', // 'App/Middleware/Auth',
  guest: 'Adonis/Middleware/AllowGuestOnly',
  cache: 'App/Middleware/Cache',
  orgs: 'App/Middleware/UserOrganization' // Get user Organization
}

/*
|--------------------------------------------------------------------------
| Server Middleware
|--------------------------------------------------------------------------
|
| Server level middleware are executed even when route for a given URL is
| not registered. Features like `static assets` and `cors` needs better
| control over request lifecycle.
|
*/
const serverMiddleware = [
  'Adonis/Middleware/Cors',
  'Adonis/Middleware/Static',
  'Adonis/Middleware/Compression'
]

Server
  .registerGlobal(globalMiddleware)
  .registerNamed(namedMiddleware)
  .use(serverMiddleware)

/*
|--------------------------------------------------------------------------
| Run Scheduler
|--------------------------------------------------------------------------
|
| Run the scheduler on boot of the web sever.
|
*/
const Scheduler = use('Adonis/Addons/Scheduler')
Scheduler.run()
