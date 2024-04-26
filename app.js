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

app.use(express.json())

const checkQueriesForGET = (request, response, next) => {
  const {status, priority, category, date} = request.query
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
    category !== 'HOME' &&
    category !== 'LEARNING'
  ) {
    response.status(400)
    response.send('Invalid Todo Category')
  } else if (date !== undefined) {
    let formattedDate = format(new Date(date), 'yyyy-MM-dd')
    let isValidDate = isValid(formattedDate)
    if (isValidDate !== true) {
      response.status(400)
      response.send('Invalid Due Date')
    }
  } else {
    next()
  }
}

const checkQueriesForPOSTAndPUT = (request, response, next) => {
  const {status, priority, category, date} = request.body
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
    category !== 'HOME' &&
    category !== 'LEARNING'
  ) {
    response.status(400)
    response.send('Invalid Todo Category')
  } else if (date !== undefined) {
    let formattedDate = format(new Date(date), 'yyyy-MM-dd')
    let isValidDate = isValid(formattedDate)
    if (isValidDate !== true) {
      response.status(400)
      response.send('Invalid Due Date')
    }
  } else {
    next()
  }
}

const checkDueDate = (request, response, next) => {
  const {date} = request.query
  const newDate = new Date(date)
  const formatedDate = format(newDate, 'yyyy-MM-dd')
  const isValidDate = isValid(formatedDate)
  if (isValidDate) {
    response.status(400)
    response.send('Invalid Due date')
  } else {
    next()
  }
}

app.get('/todos/', checkQueriesForGET, async (request, response) => {
  const {status, priority, category, search_q} = request.query
  let selectQuery
  if (status !== undefined && priority !== undefined) {
    selectQuery = `
     select * from todo where status LIKE '${status}' and priority LIKE '${priority}';`
  } else if (priority !== undefined && category !== undefined) {
    selectQuery = `
     select * from todo where priority LIKE '${priority}' and category LIKE '${category}';`
  } else if (category !== undefined && status !== undefined) {
    selectQuery = `
     select * from todo where category ='${category}' and status = '${status}';`
  } else if (status !== undefined) {
    selectQuery = `
     select * from todo where status LIKE '${status}';`
  } else if (priority !== undefined) {
    selectQuery = `
     select * from todo where priority LIKE '${priority}';`
  } else if (search_q !== undefined) {
    selectQuery = `
     select * from todo where todo LIKE '%${search_q}%';`
  } else if (category !== undefined) {
    selectQuery = `
     select * from todo where category = '${category}';`
  }
  const data = await db.all(selectQuery)
  response.send(
    data.map(eachValue => {
      return {
        id: eachValue.id,
        todo: eachValue.todo,
        priority: eachValue.priority,
        status: eachValue.status,
        category: eachValue.category,
        dueDate: eachValue.due_date,
      }
    }),
  )
})

app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const selectQuery = `
  select * from todo where id = '${todoId}';`
  const data = await db.get(selectQuery)
  console.log(data)
  response.send({
    id: data.id,
    todo: data.todo,
    priority: data.priority,
    status: data.status,
    category: data.category,
    dueDate: data.due_date,
  })
})

app.get('/agenda/?date=:date', checkDueDate, async (request, response) => {
  const {date} = request.query
  const formatedDate = format(new Date(date), 'yyyy-MM-dd')
  console.log(formatedDate)
  const selectQuery = `select * from todo where due_date = '${formatedDate}';`
  const data = await db.all(selectQuery)
  response.send(data)
})

app.post('/todos/', checkQueriesForPOSTAndPUT, async (request, response) => {
  const {id, todo, priority, status, category, dueDate} = request.body
  const formattedDate = format(new Date(dueDate), 'yyyy-MM=dd')
  const addTodoQuery = `
  INSERT INTO todo (id, todo, priority, status, category, due_date) 
  VALUES('${id}', '${todo}', '${priority}', '${status}', '${category}', '${formattedDate}');`
  await db.run(addTodoQuery)
  response.send('Todo Successfully Added')
})

app.put(
  '/todos/:todoId/',
  checkQueriesForPOSTAndPUT,
  async (request, response) => {
    const {todoId} = request.params
    let selectQuery
    const {status, priority, todo, category, dueDate} = request.body
    if (status !== undefined) {
      selectQuery = `
        update todo
        set status = '${status}'
        where id = ${todoId};`
      await db.run(selectQuery)
      response.send('Status Updated')
    } else if (priority !== undefined) {
      selectQuery = `
    update todo
    set priority = '${priority}'
    where id = ${todoId};`
      await db.run(selectQuery)
      response.send('Priority Updated')
    } else if (todo !== undefined) {
      selectQuery = `
    update todo
    set todo = '${todo}'
    where id = ${todoId};`
      await db.run(selectQuery)
      response.send('Todo Updated')
    } else if (category !== undefined) {
      selectQuery = `
    update todo
    set category = '${category}'
    where id = ${todoId};`
      await db.run(selectQuery)
      response.send('Category Updated')
    } else if (dueDate !== undefined) {
      selectQuery = `
    update todo
    set due_date = '${dueDate}'
    where id = ${todoId};`
      await db.run(selectQuery)
      response.send('Due Date Updated')
    }
  },
)

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteQuery = `delete from todo where id = ${todoId};`
  await db.run(deleteQuery)
  response.send('Todo Deleted')
})

module.exports = app
