'use strict'

const Model = use('Model')
const Config = use('Config')
const Env = use('Env')
const Cache = use('Cache')

/**
* @schema User
* required:
*   - username
*   - email
*   - password
* properties:
*   id:
*     type: integer
*     format: int64
*   username:
*     type: string
*   email:
*     type: string
*   password:
*     type: string
*/
module.exports = class User extends Model {
  static boot() {
    super.boot()

    /**
     * A hook to bash the user password before saving
     * it to the database.
     *
     * Look at `app/Models/Hooks/User.js` file to
     * check the hashPassword method
     */
    // this.addHook('beforeCreate', 'UserHook.hashPassword')

    // this.addTrait('WorkspacesUser')
    // this.addTrait('@provider:Morphable')
    // this.addTrait('@provider:HasDatabaseNotifications')
    // this.addTrait('HasDatabaseNotifications')
    // this.addTrait('@provider:Notifiable')
    // this.addTrait('@provider:Adonis/Acl/HasRole')
    // this.addTrait('@provider:Adonis/Acl/HasPermission')
    // this.addTrait('HasRole')
    // this.addTrait('HasPermission')
    // this.addTrait('@provider:CastAttributes')
    // this.addTrait('@provider:Auditable')
  }

  static get table() {
    return 'cms.t_mtr_user'
  }

  static get description() {
    return [
      { name: 'id_seq', title: 'id_seq', type: 'integer' },
      { name: 'user_group_id_int', title: 'user_group_id_int', type: 'integer' },
      { name: 'fullname_var', title: 'fullname_var', type: 'string' },
      { name: 'username', title: 'username', type: 'string' },
      { name: 'email', title: 'email', type: 'string' },
      { name: 'status_int', title: 'status_int', type: 'integer' },
      { name: 'created_by_var', title: 'created_by_var', type: 'string' },
      { name: 'created_on_dtm', title: 'created_on_dtm', type: 'date' },
      { name: 'updated_by_var', title: 'updated_by_var', type: 'string' },
      { name: 'updated_on_dtm', title: 'updated_on_dtm', type: 'date' },
      { name: 'last_login_on_dtm', title: 'last_login_on_dtm', type: 'date' },
      { name: 'is_login', title: 'is_login', type: 'boolean' },
    ]
  }

  static uniqueName() {
    return 'username'
  }

  /**
   * A relationship on tokens is required for auth to
   * work. Since features like `refreshTokens` or
   * `rememberToken` will be saved inside the
   * tokens table.
   *
   * @method tokens
   *
   * @return {Object}
   */
  tokens() {
    return this.hasMany('App/Models/Token')
  }

  notifications() {
    return this.hasMany('DatabaseNotification', 'id', 'notifiable_id')
      .where('notifiable_type', 'users')
  }

  // labels () {
  //   const Label = BaseModel.withSchema({ workspace: 0, table: `tree_label` })
  // }

  // static get casts () {
  //   return {
  //     company_id: 'int',
  //     name: 'string',
  //     interests: 'array',
  //     another: 'string',
  //   }
  // }

  // static get computed () {
  //   return ['schema']
  // }

  // getSchema ({ current_workspace_id }) {
  //   return `p${(current_workspace_id+'').padStart(Config.get('map.pad'), '0')}`
  // }

  schema() {
    return `p${(this.current_workspace_id + '').padStart(Config.get('tables.pad', 8), '0')}`
  }

  poke(channel, payload) {
    const key = `${channel}:user:${this.id}`
    Cache.store('redis').put(key, payload, 60)
  }
}
