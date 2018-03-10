const dynamoose = require('dynamoose')

const { Schema } = dynamoose

const orderSchema = new Schema({
  id: {
    type: String,
    hashKey: true
  },
  rolls: [String],
  client: String,
  total: Number,
  delivered: {
    type: Boolean,
    default: false
  },
  received: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
})

module.exports.Order = dynamoose.model(process.env.ORDER_TABLE, orderSchema)
