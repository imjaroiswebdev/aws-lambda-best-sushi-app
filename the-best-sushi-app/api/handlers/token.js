const { Token } = require('../models/subscriberToken')
const pe = require('parse-error')
const uuid = require('uuid/v1')

module.exports.addToken = (event, context, callback) => {
  // *** Error handling support in promises
  const handleErr = (errData) => {
    const errResponse = pe(errData)
    console.log(' => EVENT:', event)
    console.log(' => BODY:', body)
    callback(errResponse.stack, null)
  }

  const { pathParameters: { token } } = event

  saveToken(token)
    .then(tokenStored => {
      const response = {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(tokenStored)
      }

      console.log(` => Token [${tokenStored.token}] stored`)
      callback(null, response)
    })
    .catch(handleErr)
}

const saveToken = token =>
  Token.get({ subscriber: 'sushi-owner' })
  .then(tokenData => {
    if (!tokenData) {
      return Token.create({ subscriber: 'sushi-owner', token })
    } else {
      return Token.update({ subscriber: 'sushi-owner' }, { token })
    }
  })
