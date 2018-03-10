const { Order } = require('../models/order')
const pe = require('parse-error')
const uuid = require('uuid/v1')

module.exports.addOrder = (event, context, callback) => {
  // *** Error handling support in promises
  const handleErr = (errData) => {
    const errResponse = pe(errData)
    console.log(' => EVENT:', event)
    console.log(' => BODY:', body)
    callback(errResponse.stack, null)
  }

  const { body } = event

  createOrder(body)
    .then(newOrder => {
      const response = {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(newOrder)
      }

      console.log(` => Order [${newOrder.id}] created`)
      callback(null, response)
    })
    .catch(handleErr)
}

const createOrder = data => {
  let orderData = JSON.parse(data)
  orderData.id = uuid()

  return Order.create(orderData)
}
