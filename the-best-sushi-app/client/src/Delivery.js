import React, { Component } from 'react'
import { Button } from 'reactstrap'
import scooter from './assets/scooter.png'

export class Delivery extends Component {
  render() {
    const {
      client,
      total,
      rolls,
      delivered
    } = this.props.order

    return (
      <div className="card mb-4 box-shadow">
        <div className="card-header">
          <h4 className="my-0 font-weight-normal">
            <img src={scooter} alt="" style={{marginTop: "-15px"}} />
            {` Delivery`}
          </h4>
        </div>
        <div className="card-body">
          {
            !rolls
              ? <h1 className="card-title pricing-card-title">
                  <small className="text-muted">Without orders to deliver</small>
                </h1>
              : <React.Fragment>
                  <h1 className="card-title pricing-card-title">
                    {
                      delivered
                        ? 'Job done! 😎'
                        : '1 order'
                    }
                    {!delivered && <small className="text-muted">/ deliver to {client}</small>}
                  </h1>
                  {
                    !delivered &&
                      <React.Fragment>
                        <ul className="list-unstyled mt-3 mb-4">
                          {
                            rolls.map((roll,index) => <li key={index}>{'🍤 ' + roll}</li>)
                          }
                        </ul>
                        <Button
                          outline
                          color="primary"
                          size="lg"
                          block
                          onClick={this.props.markAsDelivered}
                        >Delivered?</Button>
                      </React.Fragment>
                  }
                </React.Fragment>
          }
        </div>
      </div>
    )
  }
}