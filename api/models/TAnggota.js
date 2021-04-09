const { Model } = require('objection');
const knex = require('../../db/knex')

Model.knex(knex)

class TAnggota extends Model {
  static get tableName() {
    return 't_anggota';
  }
  static get idColumn() {
    return ['id_anggota'];
  }
}

module.exports = TAnggota;