'use strict'

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| Http routes are entry points to your web application. You can create
| routes for different URL's and bind Controller actions to them.
|
| A complete guide on routing is available here.
| http://adonisjs.com/docs/4.1/routing
|
*/

/** @type {typeof import('@adonisjs/framework/src/Route/Manager')} */
const Route = use('Route')

// api prefix
const api = 'api/v1'

// accepted extesions
const exts = ['json', 'table', 'tablejson', 'jsontable']

// events
Route.get('/api/events', 'EventsController.events')

// Tanpa Cache
Route.group(() => {

  Route.post('/user/confirm', 'AuthController.confirm')
  Route.post('/user/login', 'UserController.login')
  Route.post('/user/refresh', 'AuthController.refresh')
  Route.post('/user/logout', 'UserController.logout')
  Route.post('/pingtest', 'UserController.pingtest')
  Route.post('/temperature', 'UserController.temperature')
}).prefix(api).formats(exts)

//  Cache
Route.group(() => {
  // Route.get('/device-management/get-device-setting', 'DeviceManagementController.getDeviceSetting')
}).prefix(api).formats(exts)
  .middleware([
    'auth:jwt',
    'cache',
    'orgs'
  ])

Route.on('/').render('welcome')
