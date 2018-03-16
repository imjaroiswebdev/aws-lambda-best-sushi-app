const { Order } = require('../models/order')
const pe = require('parse-error')
const uuid = require('uuid/v1')
const cuid = require('cuid')

module.exports.notifyOwner = (event, context, callback) => {
  // *** Error handling support in promises
  const handleErr = (errData) => {
    const errResponse = pe(errData)
    console.log(' => EVENT:', event)
    console.log(' => BODY:', body)
    // Since dynamodb streams invokes lambda functions
    // in an "Event" type way, then the results are
    // manage by the context handler methods, not
    // the case of "RequestResponse" type where this
    // this is done through the callback method
    context.fail(errResponse.stack)
  }

  console.log('EVENT:', event)

  // Selects only the records that are related to
  // modifications on the orden DB entries
  event.Records
    .filter(({ eventName }) => eventName === 'MODIFY')
    .map(({ dynamodb }) => {
      const { message, event } = notification(dynamodb)

      message && console.log('Notication message:', message)

      context.done()
    })
}

// Produces the notification message from the update
// done in the order
const notification = ({ OldImage, NewImage }) => {
  const { client } = OldImage
  let message = null

  // Since the results of the records received on
  // stream output comes directly from dynamodb
  // these are not parsed as standard plain js
  // objects like those managed with dynamoose,
  // then their values have to be referenced in
  // dynamodb notation
  const delivered = OldImage.delivered.S !== NewImage.delivered.S
  const received = OldImage.received.S !== NewImage.received.S

  if (delivered) {
    message = `Order from ${client.S} was delivered`
  } else if (received) {
    message = `${client.S} confirmed the order as received`
  }

  return message
}
