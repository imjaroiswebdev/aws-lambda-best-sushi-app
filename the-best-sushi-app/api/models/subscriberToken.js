const dynamoose = require('dynamoose')

const { Schema } = dynamoose

const subTokenSchema = new Schema({
  subscriber: {
    type: String,
    hashKey: true
  },
  token: String
})

module.exports.Token = dynamoose.model(process.env.TOKEN_TABLE, subTokenSchema)
