'use strict'

module.exports = {
  /*
  |--------------------------------------------------------------------------
  | Validation messages
  |--------------------------------------------------------------------------
  |
  | An object of validation messages to be used when validation fails.
  |
  */
  messages: {
    email: 'Enter valid email address',
    required: 'Make sure to enter the {{field}} value',
    confirmed: 'Passwords do not match',
    unique: '{{field}} is already exists',
    mis_match: 'Invalid password'
  },

  httpStatus: {
    email: 406,
    required: 406,
    confirmed: 409,
    unique: 409,
    mis_match: 401
  }
}
