const { Order } = require('../models/order')
const { Token } = require('../models/subscriberToken')
const pe = require('parse-error')
const uuid = require('uuid/v1')
const cuid = require('cuid')
const fetch = require('axios')

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

  // Selects only the records that are related to
  // modifications on the orden DB entries
  event.Records
    .filter(({ eventName }) => (eventName === 'INSERT' || eventName === 'MODIFY'))
    .map(({ dynamodb }) => {
      const { message, type } = notification(dynamodb)

      message &&
        notifyToOwner({ message, type })
          .then(({ data }) => {
            data.success === 1
              ? console.log('Notication message sent:', message)
              : handleErr(data)

            context.done()
          })
    })
}

// Produces the notification message from the update
// done in the order
const notification = ({ OldImage, NewImage }) => {
  const { client } = NewImage
  let message = type = null
  let delivered = received = false

  // Since the results of the records received on
  // stream output comes directly from dynamodb
  // these are not parsed as standard plain js
  // objects like those managed with dynamoose,
  // then their values have to be referenced in
  // dynamodb notation

  if (!OldImage) {
    message = `New order from ${client.S}`
    type = 'newOrder'
  } else {
    delivered = NewImage.delivered.S !== OldImage.delivered.S
    received = NewImage.received.S !== OldImage.received.S
  }

  if (delivered) {
    message = `Order from ${client.S} was delivered`
    type = 'delivered'
  } else if (received) {
    message = `${client.S} confirmed the order as received`
    type = 'received'
  }

  return { message, type }
}

// Sends a push notfication to the Sushi owner through FCM
const notifyToOwner = ({ type, message }) =>
  Token.get({ subscriber: 'sushi-owner' })
    .then(({ token }) =>
      fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Authorization': 'key=' + process.env.FCM_SERVER_KEY
        },
        data: {
          notification: {
            title: type === 'delivered' ? 'Order Delivered' : 'Order Received!',
            body: { type, message }
          },
          to: token
        }
      })
    )
    .catch(err => err)
