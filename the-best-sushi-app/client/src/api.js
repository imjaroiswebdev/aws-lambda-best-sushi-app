export const api = (endpoint, data) => {
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL

  return fetch(apiBaseUrl + endpoint, {
    method: data ? 'POST' : 'GET',
    body: data && JSON.stringify(data),
    headers: new Headers({
      'Content-Type': 'application/json'
    })
  })
    .then(res => res.json())
    .then(result => [null, result])
    .catch(err => {
      console.log(' => ERROR:', err.stack)
      return [err]
    })
}