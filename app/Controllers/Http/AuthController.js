'use strict'

const debug = require('debug')('controller:user')
const _ = require('lodash')
const Database = use('Database')
const Env = use('Env')
const User = use('App/Models/User')
const Config = use('Config')
const { validate } = use('Validator')
const { hashSync: hash, compareSync: compare} = require('bcryptjs')
const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const authenticator = Config.get(`auth.${Config.get('authenticator', 'jwt')}`)

const getUser = async (filter, options = {}) => {
  // remove null filter properties
  filter = _.pickBy(_.pick(filter, ['username', 'email', 'mobile']), _.identity)

  // get user
  const data = await User.query().where(filter).limit(1).fetch()
  const { rows = data } = data
  const [user] = rows
  
  return user
}

const checksum = user => {
  const payload = md5Fields.reduce((a, c) => ({ ...a, [c]: user[c] }), {})
  
  const md5 = crypto.createHash('md5').update(JSON.stringify(payload)).digest('hex')

  return md5
}

const extractjwt = req => {
  const {
    secretToken,
    accessToken = secretToken,
    token: authToken = accessToken
  } = req.all()

  // get from headers
  const { 1: auth = authToken } = (req.header('authorization') || '').split(' ')

  try {
    const jwtPayload = jwt.verify(auth, secretOrKey)
     req.jwtPayload = jwtPayload
    
    return jwtPayload
  } catch (e) {
    // if (next) return next(createError(401, 'invalid jwt'))
  }
}

const {
  usernameField = 'username',
  emailField = 'email',
  mobileField = 'mobile',
  passwordField = 'password',
  secret,
  secretOrKey = secret,
  confirmMode,
  status: statusField = 'status',
  states: { active = 'active', new: pending = 'pending' } = {},
  md5Fields = ['username', 'last_access']
} = authenticator

class AuthController {
  async signup({ params, request, response }) {
    debug(params.ctxid, '-> register', request.originalUrl())

    // validate
    const rules = {
      username: 'required',
      email: 'required|email|unique:users,email',
      password: 'required'
    }
    
    const validation = await validate(request.all(), rules)

    if (validation.fails()) {
      response.status(400)
      return validation.messages()
    }
        
    try {
      const { username, email, mobile, password } = request.all() // { username: 'user.demo', email: 'user.demo@gmail.com', password: 'demo123A!' }

      // check existing users
      const existingUser = await getUser({ username, email, mobile })

      if (existingUser) {
        response.status(409)
        throw new Error('User exists') 
      }

      // create user
      const user = new User()
      user.fill({
        [usernameField]: username.toLowerCase(),
        [emailField]: email,
        [mobileField]: mobile,
        [passwordField]: hash(password, 10),
        [statusField]: confirmMode ? pending : active,
        created_at: new Date()
      })

      // save user
      await user.save()

      // confirmation token
      if (confirmMode) {
        const payload = { id: user.id }

        const { confirmExpire: expiresIn, options } = authenticator
        const token = jwt.sign(payload, secretOrKey, { ...options, expiresIn })

        debug('signup -> confirmation successful', { ...payload, token })
        return res.json({ ...payload, token })
      }

      debug('signup -> successful', payload)
      return ({
        message: 'register successfully',
        user: user.username,
        email: user.email
      })
    } catch (error) {
      response.status(500)
      return error
    }
  }

  async confirm({ request, params, response }) {
    debug(params.ctxid, '-> login', request.originalUrl())
    
    const jwtPayload = extractjwt(request)

    const user = await getUser({ id: jwtPayload.id })

    if (!user) {
      response.status(401)
      return new  Error('User not found')
    }

    const { id, username, email } = user

    if (user[statusField] === active) return ({
      message: 'user activated',
      user: username,
      email
    })

    if (user[statusField] === pending) {
      // change state
      user[statusField] = active

      // save user
      await user.save()

      debug(params.ctxid, 'confirm -> successful', { id, username })
      return ({
        message: 'user activated',
        user: username,
        email
      })
    }

    response.status(401)
    return new Error('Invalid confirmation token')
  }

  async signin({ auth, request, params, response }) {
    debug(params.ctxid, '-> login', request.originalUrl())
    
    const { username, password } = { username: 'user.demo', password: 'demo123A!' }
      
    // get data
    const loginField = username.match(/^\d{6,15}$/)
      ? mobileField
      : username.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/)
        ? emailField
        : usernameField
          
    const user = await getUser({ [loginField]: username })

    if (!user) {
      response.status(401)
      return new Error('User not found')
    }
    
    // check password
    if (!compare(password, user[passwordField])) {
      response.status(401)
      return new Error('Wrong Username or Password')
    }

    // check active
    if (user[statusField] !== active) {
      response.status(401)
      return new Error('Profile is still not Active')
    }

    // update last access
    user.last_access = new Date()

    // save user
    await user.save()

    // hardening payload
    const payload = { id: user.id, md5: checksum(user) }

    // create jwt token
    const { expire: expiresIn, refreshExpire, options } = authenticator
    const token = jwt.sign(payload, secretOrKey, { ...options, expiresIn })
    const refreshToken = jwt.sign(payload, secretOrKey, { ...options, expiresIn: refreshExpire })

    debug(params.ctxid, 'signin -> successful', { token, refreshToken })
    return ({ token, refreshToken })
  }

  async refresh({ request, params, response }) {
    debug(params.ctxid, '-> refresh', request.originalUrl())

    const jwtPayload = extractjwt(request)

    const user = await getUser({ id: jwtPayload.id })
    
    // check user
    if (!user) {
      response.status(401)
      return new Error('User not found')
    }

    // check active
    if (user[statusField] !== active) {
      response.status(401)        
      return new Error('Profile is still not Active')
    }

    // check payload
    if (jwtPayload.md5 !== checksum(user)) {
      response.status(401)
      return new Error('Checksum error')
    }

    // update last access
    user.last_access = new Date()

    // save user
    await user.save()

    // hardening payload
    const payload = { id: user.id, md5: checksum(user) }

    // create jwt token
    const { expire: expiresIn, refreshExpire, options } = authenticator
    const token = jwt.sign(payload, secretOrKey, { ...options, expiresIn })

    // add refresh token when refresh token is almost expired
    const { jwtPayload: { exp = 0 } = {} } = req
    if ((Date.now() / 1000 - exp) < 86400) {
      const refreshToken = jwt.sign(payload, secretOrKey, { ...options, expiresIn: refreshExpire })

      debug('refresh -> successful + refresh', { token, refreshToken })
      return ({ token, refreshToken })
    }

    debug('refresh -> successful', { token })
    return ({ token })    
  }

  async logout({ auth, request, response }) {
    debug(params.ctxid, '-> logout', request.originalUrl())

    const jwtPayload = extractjwt(request)

    const user = await getUser({ id: jwtPayload.id })
    
    // check user
    if (!user) {
      response.status(401)
      return new Error('User not found')
    }

    // check active
    if (user[statusField] !== active) {
      response.status(401)
      return new Error('Profile is still not Active')
    }

    // check payload
    if (jwtPayload.md5 !== checksum(user)) {
      response.status(401)        
      return new Error('Checksum error')
    }

    // update last access
    user.last_access = new Date()

    // save user
    await user.save()

    const message = 'Sign out successful'

    debug(params.ctxid, 'logout -> successful', { message })
    return ({ message })
  }
  
  async me({ auth, request, response }) {
    const jwtPayload = extractjwt(request)

    const user = await getUser({ id: jwtPayload.id })
    
    // check user
    if (!user) {
      response.status(401)
      return new Error('User not found')
    }

    return ({ data: user.toJSON() })
  }

  async forgot({ auth, request, response }) {
    const { email } = request.all()
      
    const user = await getUser({ email })

    if (!user) {
      response.status(400)
      return new Error('User not found')
    }

    // confirmation token
    const payload = { id: user.id, email}
    const { expire: expiresIn, options } = authenticator
    const token = jwt.sign(payload, secretOrKey, { ...options, expiresIn })

    // // send mail
    // await mail.send({
      // to: email,
      // subject: 'Forgot password',
      // text: token
    // })
      
    // debug('forgot ->', { email, token })
    return ({ message: `Email sent to ${email}` })
  }

  async modify({ auth, request, response }) {
    const jwtPayload = extractjwt(request)
    
    // check email
    if (!jwtPayload.email) {
      response.status(400)
      return new Error('Invalid jwt')
    }

    const user = await getUser({ email })
    
    // check user
    if (!user) {
      response.status(400)
      return new Error('User not found')
    }
    
    const { email, password } = request.all()
    
    if (email) user.email = email
    user.password = hash(password)
      
    // update last access
    user.last_access = new Date()

    // save user
    await user.save()

    // hardening payload
    const payload = { id: user.id, md5: checksum(user) }

    debug('modify -> successful', payload)
    return payload
  }
}

module.exports = AuthController
