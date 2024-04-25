const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const isValid = require('date-fns/isValid')
const format = require('date-fns/format')
const sqlite3 = require('sqlite3')
const app = express()

const dbpath = path.join(__dirname, 'todoApplication.db')
let db = null
const intializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (error) {
    console.log(`DB Error: ${error.message}`)
    process.exit(1)
  }
}

intializeDBAndServer()

const checkQueries = (request, response, next) => {
  const {status, priority, category, date} = request.query
  const isDateValid = isValid(date)
  if (
    status !== undefined &&
    status !== 'TO DO' &&
    status !== 'IN PROGRESS' &&
    status !== 'DONE'
  ) {
    response.status(400)
    response.send('Invalid Todo Status')
  } else if (
    priority !== undefined &&
    priority !== 'HIGH' &&
    priority !== 'MEDIUM' &&
    priority !== 'LOW'
  ) {
    response.status(400)
    response.send('Invalid Todo Priority')
  } else if (
    category !== undefined &&
    category !== 'WORK' &&
    status !== 'HOME' &&
    status !== 'LEARNING'
  ) {
    response.status(400)
    response.send('Invalid Todo Category')
  } else if (date !== undefined && isDateValid === false) {
    response.status(400)
    response.send('Invalid Due Date')
  } else {
    next()
  }
}

app.get('/todos/', checkQueries, async (request, response) => {
  const {status, priority, category, search_q} = request.query
  let selectQuery
  if (status !== undefined && priority !== undefined) {
    selectQuery = `
     select * from todo where status = '${status}' and priority = '${priority}';`
  } else if (priority !== undefined && category !== undefined) {
    selectQuery = `
     select * from todo where priority = '${priority}' and category = '${category}';`
  } else if (category !== undefined && status !== undefined) {
    selectQuery = `
     select * from todo where category ='${category}' and status = '${status}';`
  } else if (status !== undefined) {
    selectQuery = `
     select * from todo where status = '${status}';`
  } else if (priority !== undefined) {
    selectQuery = `
     select * from todo where priority = '${priority}';`
  } else if (search_q !== undefined) {
    selectQuery = `
     select * from todo where todo LIKE '%${search_q}%';`
  } else if (category !== undefined) {
    selectQuery = `
     select * from todo where category = '${category}';`
  }
  const data = await db.all(selectQuery)
  response.send(data)
})

app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const selectQuery = `
  select * from todo where id = '${todoId}';`
  const data = await db.get(selectQuery)
  response.send(data)
})

app.get('/agenda/', checkQueries, async (request, response) => {
  const {date} = request.params
})

module.exports = app
