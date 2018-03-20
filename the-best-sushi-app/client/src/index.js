import React from 'react'
import ReactDOM from 'react-dom'
import 'bootstrap/dist/css/bootstrap.css'
import { messaging } from './firebase'
import './index.css'
import App from './App'
import { api } from './api'

messaging.requestPermission()
  .then(() => {
    console.log('Notification permission for Sushi Owner granted')
    return messaging.getToken()
  })
  .then(currToken => {
    const apiEndpoint = `/subscriber/${currToken}`

    api(apiEndpoint)
      .then(([err]) => {
        if (err) {
          throw err
        }
      })
  })
  .catch(err => console.error(err))

ReactDOM.render(<App />, document.getElementById('root'))
