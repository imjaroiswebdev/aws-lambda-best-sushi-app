import React, { Component } from 'react'
import { Alert } from 'reactstrap'
import sushiOwner from './assets/sushi-owner.png'

export class SushiOwner extends Component {
  render() {
    const { notification } = this.props

    return (
      <div className="card mb-4 box-shadow">
        <div className="card-header">
          <h4 className="my-0 font-weight-normal">
            <img src={sushiOwner} alt="" />
            {` Sushi Owner`}
          </h4>
        </div>
        <div className="card-body">
          {
            notification.length === 0
              ? <h1 className="card-title pricing-card-title">
                  <small className="text-muted">There's not new notifications</small>
                </h1>
              : notification.map((notif, index) =>
                  <Alert key={index} color={notif.type === "delivered" ? "primary" : "success"}>
                    {notif.msg}
                  </Alert>
                )
          }
        </div>
      </div>
    )
  }
}