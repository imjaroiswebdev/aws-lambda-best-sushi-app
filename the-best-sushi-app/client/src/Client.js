import React, { Component } from 'react'
import { Button } from 'reactstrap'
import clientIcon from './assets/client.png'

export class Client extends Component {
  render() {
    const {
      client,
      total,
      rolls,
      received
    } = this.props.order

    return (
      <div className="card mb-4 box-shadow">
        <div className="card-header">
          <h4 className="my-0 font-weight-normal">
            <img src={clientIcon} alt="" style={{marginTop: "-5px"}} />
            {` Client`}
          </h4>
        </div>
        <div className="card-body">
          {
            !rolls
              ? <Button color="success" size="lg" block onClick={this.props.createOrder}>
                  Ask for Sushi!
                </Button>
              : <React.Fragment>
                  <h1 className="card-title pricing-card-title">
                    {
                      received
                        ? 'Enjoy! 😊'
                        : '$' + total
                    }
                    {!received && <small className="text-muted">/ to pay</small>}
                  </h1>
                  <ul className="list-unstyled mt-3 mb-4">
                    {
                      rolls.map((roll,index) => <li key={index}>{'🍤 ' + roll}</li>)
                    }
                  </ul>
                  {
                    !received &&
                      <Button
                        color="primary"
                        size="lg"
                        block
                        onClick={this.props.markAsReceived}
                      >Received?</Button>
                  }
                </React.Fragment>
          }
        </div>
      </div>
    )
  }
}