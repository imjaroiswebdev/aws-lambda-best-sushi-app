﻿# Monitoring and Debugging an AWS Lambda Backed Sushi Delivery App without knowing about AWS

<br>

![Monitor and debug AWS Lambda Apps without knowing of AWS](./assets/lambda-backed-app-without-knowing-aws.jpg)

The serverless technology is becoming something as exciting and challenging as it might was deploying our first app to the internet and see it come to life, work and also crash. Maybe the latter more than we wanted at the begging, but later when we overcame that challenge we felt like we could with everything until we acknowledged the real world production app and their architecture.

That depending in our interests, that world could maybe pushed us out of the way to focus more in our code and let that task of deploying, monitoring and giving support for apps to the Devops guys.

Well, nowadays that esoteric atmosphere of dev operation process is changing in some of its stages, because of technologies like Serverless computing for supporting the real world apps, bringing again the power of creating code and functionality that can be deployed by the same developer that is writing it.

![Our Sushi delivery app architecture](./assets/architecture-the-best-sushi-app.png "App architecture")

So we are here for developing together the delivery part of a Sushi Restaurant App that will have the following features...

* Creation of an order by the client.
* Push notification for the owner about the new order.
* Asynchronous updating of the order by the delivery guy.
* In same way asynchronous update by the client that it has received the order.
* The Sushi owner will received notification in real time about those updates.

Since we would be using the AWS environment and a lot of us developers that are reading this have __NodeJs__ background and the point here is to code and produce working apps, then i want to show you a way of making a Serverless API using AWS Lambda without the need of knowing in deep of their service but in the same way using it for production level apps. (But hey! don't forget to read about the AWS Free tier limit and prices of their services - [AWS Pricing](https://aws.amazon.com/free/))

<br>

![Dashbird dashboard for the notifyOwner service](./assets/monitoring-overview-notifyOwner.png "notifyOwner service metrics")

The trick here is done with the use of [__Dashbird__](https://dashbird.io/) a platform for monitoring, debugging, notifying, alerting, performing cost analysis and more about the execution of your serverless services.

So instead of dealing with AWS Cloudwatch logging for monitoring, sns topics for alerting and ... We will just analyze our Dashbird dashboard and act when we received the alert emails for errors, incomplete executions and more.

<br>

## Let's start building our Sushi Delivery App

Maybe you were asking... Ok! we can observe our working serverless app, but how do i deploy it to AWS?

The answer is self explanatory (just kidding), well with the [__Serverless Framework__](https://serverless.com/framework/docs/providers/aws/) for using with precisely AWS Lambda functions and API Gateway. As many of you already may know this framawork is an amazing tool for creating serverless apps and considering the complexity of the task of dealing with packaging and deploying those at the begging you will agreed that this look like dropped from heavens.

<br>

#### The Best Sushi App (Our app)

![The Best Sushi App working](./assets/app-working.gif)

The complete app source code is available in this [repository]() and is branched in the same way that will be explain it here...

* master (__Complete app__)
1. adding-orders
2. received-and-delivered
3. notify-owner

So for best follow up of the app building process, proceed to download the project from the repository with...

```bash
  $ git clone git@github.com:imjaroiswebdev/aws-lambda-best-sushi-app.git
  $ # Then cd in our app folder
  $ cd best-sushi-app/api
  $ # Install the dependencies
  $ npm i
```

<br>

## 1. Filling the requisites

First of all we need to ensure that we have installed *__SERVER⚡LESS__* in our computer, if not then we proceed with npm...

```bash
  $ npm i -g serverless
```

Then to continue we need to configure our AWS credentials if we haven't done it before, so if that is the case, then proceed with this [Serverless guide for AWS Credentials.](https://serverless.com/framework/docs/providers/aws/cli-reference/config-credentials/)

<br>

## 2. Start coding with the order's database

For modeling and interacting with the database of the app we will be using [Dynamoose](https://github.com/automategreen/dynamoose) since the database that we would using the AWS NOSQL one DynamoDB and Dynamoose is a modeling tool for this database that has an API inspired by Mongoose, so for the one of us that are comfortable creating apps with MongoDB then with Dynamoose you will feel at home.

The job of provisioning resources in Amazon will be done by our __serverless.yml__ configuration and we will need to declare the IAM roles for allowing the lambda functions to access the Dynamo database where we are going to store the orders.

```yml
# serverless.yml
  .
  .
  .
provider:
  name: aws
  runtime: nodejs6.10
  stage: ${opt:stage, 'dev'}
  region: us-east-1
  environment:
      ORDER_TABLE: order-theBestSushiApp-${opt:stage, self:provider.stage}

  # Is not a good practice but if you want to don't
  # care about setting punctual permissions then you
  # just set in actions and resources allowed...
  # Action:
  #   - dynamodb:*
  # Resource: "arn:aws:dynamodb:${opt:region, self:provider.region}:*:table/*"
  iamRoleStatements:
    - Effect: Allow
      Action:
        - dynamodb:DescribeTable
        - dynamodb:Query
        - dynamodb:Scan
        - dynamodb:GetItem
        - dynamodb:PutItem
        - dynamodb:UpdateItem
        - dynamodb:DeleteItem
        - dynamodb:GetRecords
        - dynamodb:GetShardIterator
        - dynamodb:DescribeStream
        - dynamodb:ListStreams
      Resource: "arn:aws:dynamodb:${opt:region, self:provider.region}:*:table/${self:provider.environment.ORDER_TABLE}"

functions:
  .
  .
  .
resources:
  Resources:
    orderTable:
      Type: 'AWS::DynamoDB::Table'
      DeletionPolicy: Retain
      Properties:
        TableName: ${self:provider.environment.ORDER_TABLE}
        AttributeDefinitions:
          -
            AttributeName: id
            AttributeType: S
        KeySchema:
          -
            AttributeName: id
            KeyType: HASH
        ProvisionedThroughput:
          ReadCapacityUnits: 1
          WriteCapacityUnits: 1
        # Stream enabling order status notification
        StreamSpecification:
          StreamViewType: NEW_AND_OLD_IMAGES

```

<br>

In this way just got configured the order database for start using with the app (Enable streams only if you need them). In the models folder we define the order's model for creating new ones.

```javascript
// api/models/order.js
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
```

<br>

Then in the folder handlers we continue with the creation of the service for adding new orders to the database of the Sushi App, in the file `add.js` following the [signature of an AWS Lambda function](https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-handler.html)...

```javascript
// api/handlers/add.js
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
```

The function `createOrder` have been defined outside the handler `addOrder` itself to maintain only the IO task in it, since this improves the cold start timespan. Consider that the maximum Node runtime that can be set for Lambda functions is v6.10, so if you want to use `Object static methods, object rest/spread, async/await` or any other ES6+ suggar you need to enabled through Babel transpilling and this app project is ready to received through webpack loader, but the configuration of configuration of it for production level results is out of the scope of this article (maybe the next time😊).

<br>

## 3. Deploying and testing the add order service endpoint

Having the handler developed we need to define it in the `serverless.yml` file in the functions list...

```yml
# serverless.yml
  .
  .
  .

  functions:
    addOrder:
      description: Adds a new order
      handler: handlers/add.addOrder
      events:
        # http events declarations informs Serverless
        # to provision API Gateway Lambda proxy integration
        # for this function to be accesible through the
        # defined path and http verb
        - http:
            path: order/add
            method: post
            cors: true
  .
  .
  .
```

Here we got Serverless doing for us the work of configuring and provision the Lambda function packaging and uploading, also and very important setting the AWS Api Gateway proxy integration for allowing access through the endpoint path defined (here "order/add") and with the `POST` method for receiving the order data.

<br>

#### Let's deploy 🚀

In the terminal located in the folder of the project where we got the `serverless.yml` file we enter...

```bash
  $ serverless deploy
```
As a result for the deploy we got this result...

![Result of deploying addOrder service](./assets/addOrder-deploy-result.png)

Which means that we are going in good way, now let's give the endpoint a try and add a new order to the database. For this i will be using [Postman](https://www.getpostman.com/)...

![Result of sending an order to the addOrder service through its endpoint](./assets/addOrder-endpoint-result.png)

<br>

#### Yeah!! 👏 All is working good.

Now if we go to our AWS console and from there to our DynamoDB tables view we will have our first entry to the table...

![Entry on the DynamoDB database result of sending the order to the service](./assets/addOrder-dynamodb-result.png)

<br>

So up to this point all the process is complete the data is being stored and we can go further we the rest of the app functionality.

<br>

## 4. Endpoints for updating as delivered and received

The functionality relative to the delivery guy and the client of updating the order as delivered and received respectively will be done by 2 services invoked by its endpoints, so now you can change the project to the branch `received-and-delivered` for the follow up of those simple services.

We'll proceed to declare them in the serverless.yml file...

```yml
# serverless.yml
  .
  .
  .

functions:
  addOrder:
    ...

  setAsDelivered:
    description: Updates an order as delivered
    handler: handlers/delivered.setAsDelivered
    events:
      - http:
          path: delivery/order/{id}/delivered
          method: get
          cors: true

  setAsReceived:
    description: Updates an order as received
    handler: handlers/received.setAsReceived
    events:
      - http:
          path: client/order/{id}/received
          method: get
          cors: true
  .
  .
  .
```

These services will only update the status of the order we will be ordering to do it through `GET` with the __id__ of the order, but since we are receiving the id as a parameter in the url, the code of the handlers for these services is a bit different from the `addOrder.js` but at the same time very straightforward...

```javascript
// delivered.js
module.exports.setAsDelivered = (event, context, callback) => {
  // *** Error handling support in promises
  const handleErr = (errData) => {
    const errResponse = pe(errData)
    console.log(' => EVENT:', event)
    console.log(' => BODY:', body)
    callback(errResponse.stack, null)
  }

  // Here we get the id from the url
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
```

Now that we have two more services we will deploy them like before with...

```bash
  $ serverless deploy
```

<br>

As a result we will now have the endpoints for the two just deployed services...

![Result of deploying the services setAsDelivered and setAsReceived](./assets/received-and-delivered-deploy-result.png)

<br>

#### Now for testing result with Postman

![Result of updating as delivered through the setAsDelivered endpoint](./assets/received-and-delivered-endpoint-result.png)

<br>

## 5. Time for event driven services for notifying the Sushi Owner


![Our Sushi delivery app architecture](./assets/architecture-featuring-notifyOwner.png "App architecture")

Let's see in more detail the architecture diagram of our Sushi Delivery app, there we have one service (Lambda function) that is not integrated with an endpoint through API Gateway and the array signaling the data flow is from the Order's database to the service. This setup is basically the so called event driven service pattern, where the service __notifyOwner__ (in this case) only read the results of the updated orders from the database through an event stream provided by the DB and reacts as a result of the change doing an additional action.

<br>

#### ℹ Change gears to the branch `notify-owner`

If we look again to the serverless.yml file specifically at the order database resources provision at the end we have...

```yml
  # serverless.yml
  .
  .
  .
resources:
  Resources:
    orderTable:
      Type: 'AWS::DynamoDB::Table'
      DeletionPolicy: Retain
      Properties:
        TableName: ${self:provider.environment.ORDER_TABLE}
        AttributeDefinitions:
          -
            AttributeName: id
            AttributeType: S
        KeySchema:
          -
            AttributeName: id
            KeyType: HASH
        ProvisionedThroughput:
          ReadCapacityUnits: 1
          WriteCapacityUnits: 1

        # In this section we before enabled the
        # event stream of data that will later be
        # listened by notifyOwner service
        StreamSpecification:
          StreamViewType: NEW_AND_OLD_IMAGES
```

The stream type definition that we enabled will serve a stream of data with a payload distinguish by its type following this signature...

```json
  // Record response payload for NEW_AND_OLD_IMAGES streams

  {
   "NextShardIterator": "string",
    "Records": [
        {
          "awsRegion": "string",
          "dynamodb": {
              "ApproximateCreationDateTime": number,
              "NewImage": {
                "id": {
                  "S": "string"
                },
                "rolls": {
                  "SS": ["string"]
                },
                "client": {
                  "S": "string"
                },
                "delivered": {
                  "BOOL": boolean
                },
                "received": {
                  "BOOL": boolean
                },
                "createdAt": {
                  "N": "string"
                },
                "updatedAt": {
                  "N": "string"
                }
              },
              "OldImage": {
                "id": {
                  "S": "string"
                },
                "rolls": {
                  "SS": ["string"]
                },
                "client": {
                  "S": "string"
                },
                "delivered": {
                  "BOOL": boolean
                },
                "received": {
                  "BOOL": boolean
                },
                "createdAt": {
                  "N": "string"
                },
                "updatedAt": {
                  "N": "string"
                }
              },
              "SequenceNumber": "string",
              "SizeBytes": number,
              "StreamViewType": "string"
          },
          "eventID": "string",
          "eventName": "string",
          "eventSource": "string",
          "eventVersion": "string",
          "userIdentity": {
              "PrincipalId": "string",
              "Type": "string"
          }
        }
    ]
  }
```

For notifying the owner of a new order, reception by the client and delivery, we will make use of the properties `eventName` and `OldImage` and `NewImage`. Like before we are going to declare the service in the serverless.yml file...

<br>

```yml
  # serverless.yml
  .
  .
  .
  notifyOwner:
    description: Notifies the Sushi owner through Firebase Cloud Messaging whenever he gets a new order, or when that order is received or delivered
    handler: handlers/notify.notifyOwner
    events:
      - stream:
          type: dynamodb
          arn:
            Fn::GetAtt:
              - orderTable
              - StreamArn
          batchSize: 1
  .
  .
  .
```

So now we'll proceed with the __notifyOwner__ service that is located in the `notify.js` file in the handlers folder...

<br>

```javascript
  // notify.js

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
    // modifications and new entries on the orden DB entries
    event.Records
      .filter(({ eventName }) => (eventName === 'INSERT' || eventName === 'MODIFY'))
      .map(({ dynamodb }) => {
        const { message, type } = notification(dynamodb)

        message &&
          notifyToOwner({ message, type })
            .then(({ data }) => {
              data.success === 1
                ? console.log('Notification message sent:', message)
                : handleErr(data)

              context.done()
            })
      })
  }
```

The code in charge of creating the notification message depending on the event received result of an update in the order's database table is `notifyToOwner` and as before is defined outside the service handler...

```javascript
  // notify.js

  module.exports.notifyOwner = (event, context, callback) => {
    .
    .
    .
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
```

<br>

#### 💬  Time to send messages!

The messages created by `notifyToOwner` will finally sent to owner Sushi app module when a client ask for a new order, the delivery guy completes a delivery and when the client confirms its order as received. Everyone of those messages will be sent through the push notification service of Firebase. Notice that besides this is a service of AWS is not limited or forced to use only the AWS products, because of that we are using FCM to push the messages to the owner.

<br>

> ℹ  The scope of this article does not include the details about setting up Firebase Cloud Messaging, but the configuration used is the basic for use in a sufficient number of cases and specially notice that we are using the rest api version of the FCM service for not making use of external libraries that may add bulk to our service.

```javascript
  // notify.js
  .
  .
  .
  // Sends a push notification to the Sushi owner through FCM
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
              title: type === 'delivered'
                ? 'Order Delivered'
                : 'Order Received!',
              body: { type, message }
            },
            to: token
          }
        })
      )
      .catch(err => err)
```

As happens in the real world apps we need to have a registry of every subscribed client (__app__) that is listening for notifications, so we need to add a persistent way to maintain that registry in this case in a form of another table called `tokenTable` where the only subscriber that we'll have (__sushi-owner__) will submit its FCM client token to our database for us to know where to send the new messages.

That is the explanation of the other model seen in notifyOwner service.

To complete this task don't forget to run once again...

```bash
  $ serverless deploy
```

<br>

## 6. 🍣 The Best Sushi App in action

Now we can go to the folder `client` and run...

```bash
  $ yarn && yarn start
```

That will open a tab in our browser with __🍣 The Best Sushi__ ready for putting on work our Serverless backed API for the restaurant.

![The Best Sushi App first screen](./assets/app-capture-1.png)

<br>

#### 💫 We can start asking for sushi then...

![The Best Sushi App first screen](./assets/app-capture-2.png)

Notice that when the client ask for Sushi a notification of a new order is received by the Sushi Owner module that is only listening for new notifications updates that it receives as a prop from the App component.

```javascript
  // App.js
  .
  .
  .
  class App extends Component {
    state = {
      notification: []
    }

    componentDidMount() {
      messaging.onMessage(payload =>
        this.setState(({ notification }) => {
          const { type, message } = JSON.parse(payload.notification.body)

          notification.push({
            type,
            message
          })

          return { notification }
        }))
    }

    render() {
      .
      .
      .
    }
  }
```

<br>

The same happens with the new notifications when the order is set as delivered and received...

![The Best Sushi App order set as delivered](./assets/app-capture-3.png)

<br>

![The Best Sushi App order set as received](./assets/app-capture-4.png)


## 7. What we do when something goes wrong? (__Dashbird__ to the rescue)

This is the moment when you will suffer for not knowing how to deal in a natural way with AWS Cloudwatch, because when you are developing your service the Serverless Framework offers you good tools for debugging your code without entering to AWS, like...

```bash
  # Watch the logs resulting of a particular service invocation
  $ serverless invoke -f addOrder -p event.json -l

  # In another terminal window
  # To maintain a open stream of the tail of logs generated by the service passed as parameter
  $ serverless logs -f notifyOwner -t
```

<br>

But in production you a monitoring and observability dashboard for your running services backing your app. Thing if we know about creating Cloudwatch dashboard then would not be any problem to get any of the data that we want about our Serverless backend, but if you are a very good developer without any knowledge of AWS, you would need something else if you still want to embark in movement of Serverless apps.

<br>

#### The Solution 🤯

![Dashbird overview Dashboard](./assets/dashbird-overview-stats.png)

Here you got a complete and detailed Dashboard for monitor and observe everything happening with your services.

![notifyOwner service Dashboard](./assets/dashbird-notifyOwner-stats.png)

![notifyOwner service Dashboard](./assets/dashbird-addOrder-stats.png)

<br>

Here you will find every log for every running service, easy filterable by type, date and more live tail at one click of distance without a terminal or your AWS credentials if your are away for your developing computer.

Also they will notify you if error happens through emails.

#### Performance improvement department

![Memory provision statictics](./assets/dashbird-memory-stats.png)

See this, because we are only using the default configuration provided by Serverless Framework for provisioning Lambda Functions that set by default 1GB of Ram memory, then we are stacking this valuable assets without any concern and for being most cost efficients we can test if running our services with a minor Ram can maintain the performance in invocation duration and cold start timespan, finding out that the extra bump of Ram was just a waste.

That is just one of many analysis that we can achieve with the use of Dashbird without opening our AWS Console.

## Conclusion

Well, that was a bit long for at least some of you but the main point was to show the basic of Serverless apps and how to implemented a basic event driven functionality to your services, but also the impotance of knowing how to monitore your running in production app without the out of confidence of not knowing about AWS products for this task, but for completely solving this, we got Dashbird backing us up for continue in our development trip of Serverless production apps with confidence.