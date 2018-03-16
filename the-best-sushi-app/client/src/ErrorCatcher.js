import React, { Component } from 'react'

export class ErrorCatcher extends Component {
  state = {
    errorOcurred: false,
    err: null,
    info: null
  }

  componentDidCatch(err, info) {
    this.setState({
      errorOcurred: true,
      err,
      info
    })

    console.error(err)
  }

  render() {
    if (this.state.errorOcurred) {
      return (
        <React.Fragment>
          <h1 className="error-title">
            Something went wrong 😱
          </h1>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            {this.state.err && this.state.err.toString()}
            <br />
            {this.state.info && this.state.info.componentStack}
          </details>
        </React.Fragment>

      )
    } else {
      return this.props.children
    }
  }
}