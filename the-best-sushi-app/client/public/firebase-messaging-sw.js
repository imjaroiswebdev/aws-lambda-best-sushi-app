importScripts('https://www.gstatic.com/firebasejs/3.9.0/firebase-app.js')
importScripts('https://www.gstatic.com/firebasejs/3.9.0/firebase-messaging.js')

firebase.initializeApp({
  'messagingSenderId': '1085695706198'
})

const messaging = firebase.messaging()

messaging.setBackgroundMessageHandler(payload => {
  console.log('The Best Sushi App Received background message ', payload)
  const { body, title } = payload

  var notificationTitle = '🍣 ' + title
  var notificationOptions = {
    body,
    icon: '/static/media/sushi.png'
  }

  return self.registration.showNotification(notificationTitle,
    notificationOptions)
})