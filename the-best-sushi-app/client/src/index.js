import React from 'react'
import ReactDOM from 'react-dom'
import 'bootstrap/dist/css/bootstrap.css'
import { messaging } from './firebase'
import './index.css'
import App from './App'

messaging.requestPermission()
  .then(() => {
    console.log('Notification permission granted')
    return messaging.getToken()
  })
  .then(currToken => {
    console.log('Current token:', currToken)
  })
  .catch(err => console.error(err))

ReactDOM.render(<App />, document.getElementById('root'))
