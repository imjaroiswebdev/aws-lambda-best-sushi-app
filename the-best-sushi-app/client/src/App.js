import React, { Component } from 'react'
import { Container } from 'reactstrap'
import { messaging } from './firebase'
import { Modules } from './Modules'
import { ErrorCatcher } from './ErrorCatcher'
import './App.css'
import sushi from './assets/sushi.png'

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
    return (
      <React.Fragment>
        <div className="app-header px-3 py-3 pt-md-5 pb-md-5 mx-auto text-center">
          <h1 className="display-2 tastysushiFont" style={{color: "#28a745"}}>
            The Best Sushi App <img src={sushi} alt="" />
          </h1>
          <p className="lead">Delivery flow monitoring for the restaurant owner. Based on the three modules available for each one of the participants: Delivery Guy, Client and Sushi Owner. All in the same window for demostration sake.</p>
        </div>

        <Container>
          <div className="card-deck mb-3 text-center">
            <ErrorCatcher>
              <Modules notification={this.state.notification} />
            </ErrorCatcher>
          </div>
        </Container>
      </React.Fragment>
    )
  }
}

export default App
