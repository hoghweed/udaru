'use strict'

const Boom = require('boom')
const async = require('async')
const dbUtil = require('./dbUtil')

module.exports = function (dbPool, log) {
  var organizationOps = {

    /**
     * Fetch all organizations
     *
     * @param  {Object}   args
     * @param  {Function} cb
     */
    list: function list (args, cb) {
      dbPool.query('SELECT id, name, description FROM organizations ORDER BY UPPER(name)', function (err, result) {
        if (err) return cb(Boom.badImplementation(err))

        return cb(null, result.rows)
      })
    },

    /**
     * Creates a new organization
     *
     * @param  {Object}   args {id, name, description}
     * @param  {Function} cb
     */
    create: function create (args, cb) {
      let params = [args.id, args.name, args.description]

      dbPool.query('INSERT INTO organizations (id, name, description) VALUES ($1, $2, $3) RETURNING id', params, function (err, result) {
        if (err) return cb(Boom.badImplementation(err))

        organizationOps.readById(result.rows[0].id, cb)
      })
    },

    /**
     * Fetch data for an organization
     *
     * @param  {String}   id
     * @param  {Function} cb
     */
    readById: function readById (id, cb) {
      dbPool.query('SELECT id, name, description FROM organizations WHERE id = $1', [id], function (err, result) {
        if (err) return cb(Boom.badImplementation(err))
        if (result.rowCount === 0) return cb(Boom.notFound())

        return cb(null, result.rows[0])
      })
    },

    /**
     * Delete organization
     *
     * @param  {String}   id
     * @param  {Function} cb
     */
    deleteById: function deleteById (id, cb) {
      const tasks = []
      let usersParams = []
      dbPool.connect(function (err, client, done) {
        if (err) return cb(Boom.badImplementation(err))

        tasks.push((next) => { client.query('BEGIN', next) })
        tasks.push((res, next) => {
          client.query('SELECT id FROM users WHERE org_id = $1', [id], function (err, result) {
            if (err) return next(err)
            if (result.rowCount === 0) return next(null, [])

            usersParams = result.rows.map(r => r.id)
            next(null, usersParams)
          })
        })
        tasks.push((res, next) => {
          if (usersParams.length === 0) return next(null, res)

          client.query('DELETE FROM team_members WHERE user_id = ANY($1::int[])', [usersParams], next)
        })
        tasks.push((res, next) => {
          if (usersParams.length === 0) return next(null, res)

          client.query('DELETE FROM user_policies WHERE user_id = ANY($1::int[])', [usersParams], next)
        })
        tasks.push((res, next) => {
          client.query('SELECT id FROM teams WHERE org_id = $1', [id], function (err, result) {
            if (err) return next(err)
            if (result.rowCount === 0) return next(null, [])

            next(null, result.rows.map(r => r.id))
          })
        })
        tasks.push((res, next) => {
          if (res.length === 0) return next(null, res)

          client.query('DELETE FROM team_policies WHERE team_id  = ANY($1::int[])', [res], next)
        })
        tasks.push((res, next) => { client.query('DELETE FROM policies WHERE org_id = $1', [id], next) })
        tasks.push((res, next) => { client.query('DELETE FROM teams WHERE org_id = $1', [id], next) })
        tasks.push((res, next) => { client.query('DELETE FROM users WHERE org_id = $1', [id], next) })
        tasks.push((res, next) => {
          client.query('DELETE FROM organizations WHERE id = $1', [id], function (err, result) {
            if (err) return next(err)
            if (result.rowCount === 0) return next(Boom.notFound())

            next(null, result)
          })
        })
        tasks.push((res, next) => { client.query('COMMIT', next) })

        async.waterfall(tasks, (err) => {
          if (err) {
            dbUtil.rollback(client, done)
            return cb(err.isBoom ? err : Boom.badImplementation(err))
          }

          done()
          return cb(null)
        })
      })
    },

    /**
     * Updates all (for now) organization properties
     *
     * @param  {Obejct}   args {id, name, description}
     * @param  {Function} cb
     */
    update: function update (args, cb) {
      let params = [args.id, args.name, args.description]

      dbPool.query('UPDATE organizations SET name = $2, description = $3 WHERE id = $1', params, function (err, result) {
        if (err) return cb(Boom.badImplementation(err))
        if (result.rowCount === 0) return cb(Boom.notFound())

        return cb(null, {id: args.id, name: args.name, description: args.description})
      })
    }
  }

  return organizationOps
}
