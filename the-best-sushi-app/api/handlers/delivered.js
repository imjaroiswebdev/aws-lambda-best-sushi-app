const { Order } = require('../models/order')
const pe = require('parse-error')
const uuid = require('uuid/v1')

module.exports.setAsDelivered = (event, context, callback) => {
  // *** Error handling support in promises
  const handleErr = (errData) => {
    const errResponse = pe(errData)
    console.log(' => EVENT:', event)
    console.log(' => BODY:', body)
    callback(errResponse.stack, null)
  }

  const { pathParameters: { id } } = event

  Order.update({ id, delivered: true })
    .then(deliveredOrder => {
      const response = {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(deliveredOrder)
      }

      console.log(` => Order [${deliveredOrder.id}] set as delivered`)
      callback(null, response)
    })
    .catch(handleErr)
}
