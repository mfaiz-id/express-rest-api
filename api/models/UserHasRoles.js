const { Model } = require('objection');
const knex = require('../../db/knex')

Model.knex(knex)

class UserHasRoles extends Model {
  static get tableName() {
    return 'user_has_roles';
  }
  static get idColumn() {
    return ['id'];
  }
}

module.exports = UserHasRoles;