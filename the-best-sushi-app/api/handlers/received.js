const { Order } = require('../models/order')
const pe = require('parse-error')
const uuid = require('uuid/v1')

module.exports.setAsReceived = (event, context, callback) => {
  // *** Error handling support in promises
  const handleErr = (errData) => {
    const errResponse = pe(errData)
    console.log(' => EVENT:', event)
    console.log(' => BODY:', body)
    callback(errResponse.stack, null)
  }

  const { pathParameters: { id } } = event

  Order.update({ id, received: true })
    .then(receivedOrder => {
      const response = {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(receivedOrder)
      }

      console.log(` => Order [${receivedOrder.id}] set as received`)
      callback(null, response)
    })
    .catch(handleErr)
}
