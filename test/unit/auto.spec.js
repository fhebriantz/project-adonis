'use strict'

const Route = use('Route')
const User = use('App/Models/User')
const _ = require('lodash')

const queries = { get: 'query', post: 'send' }

const params = {
  node: 'All',
  node: 'Immobi South Jakarta',
  node: ["Immobi South Jakarta","Telkom 2 East Jakarta","Telkom 3 Bekasi"],
  node: 'East Jakarta',

  // city: 'Jakarta',
  // city: 'Singapore',
  // city: ['Immobi South Jakarta', 'Telkom 2 East Jakarta', 'Telkom 3 Bekasi'],

  location: 'Edge',
  location: 'Jakarta',

  // dataLoc: 'Jakarta',

  // ne: 'BRAS3-D2-JT',

  source: 'Immobi South Jakarta',
  // source: ['Immobi South Jakarta'],

  dest: 'CNN_Indonesia',
  destGroup: 'News',

  providers: 'Indihome',
  providers: 'Remote-GCP',
  // providers: ['Indihome', 'Moratel'],

  destination: 'GW_BDS1',
  destinations: ['CNN_Indonesia'],
  
  dateStart: '2022-03-23 00:00:00',
  dateEnd: '2022-03-30 23:59:59',
  // startDate: '2022-02-16',
  // endDate: '2022-03-24',
  
  period: 'daily',
  
  type: 'latency',
  
  resolution: 2160,
  resolution: 'All',
  
  method: 'ookla',
  
  kpi: '%',
  kpi: 'Performance Rate',

  value: 100338,
  
  label: 'TotalDevice',
  
  user: 1,
  userId: 1
}

const groutes = _.groupBy(Route.list(), r => r._route.split('/')[3])
delete groutes.user
delete groutes.undefined

for (const key in groutes) {
  const { before, trait, test } = use('Test/Suite')(key)

  trait('Auth/Client')
  trait('Test/ApiClient')
  // trait('DatabaseTransactions')

  let user

  before(async () => {
    // prepare user for authorization
    user = await User.first()
  })

  for (const route of groutes[key]) {
    const [url] = route._route.split(':format(')
    
    for (const verb of route.verbs) {
      const method = verb.toLowerCase()
      
      // only get and post methods are processed
      if (queries[method]) {          
        test(url, async ({ client, assert }) => {
          let res = client[method](`${url}.json`)
            .type('json')
            .loginVia(user, 'jwt')
            
          // put data
          res = await res[queries[method]](params).end()
                      
          res.assertStatus(200)
          // res.assertJSON({})
        })
      }
    }
  }
}