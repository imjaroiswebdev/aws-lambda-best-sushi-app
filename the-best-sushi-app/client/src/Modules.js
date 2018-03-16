import React, { Component } from 'react'
import { Delivery } from './Delivery'
import { Client } from './Client'
import { SushiOwner } from './SushiOwner'
import { api } from './api'
import mockOrders from './mockOrders'

export class Modules extends Component {
  state = {
    order: {}
  }

  createOrder = () => {
    const choosenOrderIndex = Math.ceil(Math.random() * 3) - 1
    const newOrderData = mockOrders[choosenOrderIndex]

    api('/order/add', newOrderData)
      .then(([err, order]) => {
        if (err) {
          this.setState(() => {
            throw err
          })
        } else {
          this.setState({ order })
        }
      })
  }

  markAsDelivered = () => {
    const apiEndpoint = `/delivery/order/${this.state.order.id}/delivered`

    api(apiEndpoint)
      .then(([err, order]) => {
        if (err) {
          this.setState(() => {
            throw err
          })
        } else {
          this.setState({ order })
        }
      })
  }

  markAsReceived = () => {
    const apiEndpoint = `/client/order/${this.state.order.id}/received`

    api(apiEndpoint)
      .then(([err, order]) => {
        if (err) {
          this.setState(() => {
            throw err
          })
        } else {
          this.setState({ order })
        }
      })
  }

  render() {
    return (
      <React.Fragment>
        <Delivery
          order={this.state.order}
          markAsDelivered={this.markAsDelivered}
        />
        <Client
          order={this.state.order}
          createOrder={this.createOrder}
          markAsReceived={this.markAsReceived}
        />
        <SushiOwner notification={this.props.notification} />
      </React.Fragment>
    )
  }
}