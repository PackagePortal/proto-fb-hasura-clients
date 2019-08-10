// Initialize Firebase
var config = {
  apiKey: "AIzaSyCOEehbQA_7hvXV_WL8zvjkIEnJPagLBR0",
  authDomain: "pp-api-dev.firebaseapp.com",
  databaseURL: "https://pp-api-dev.firebaseio.com",
  projectId: "pp-api-dev",
  storageBucket: "pp-api-dev.appspot.com",
  messagingSenderId: "671703588548",
  appId: "1:671703588548:web:a68dafb4956715a5"
};
firebase.initializeApp(config);

document.getElementById('login-form').onsubmit = function(event) {
  event.preventDefault();
  let email = document.getElementById('email').value;
  let pass = document.getElementById('password').value;
  login(email, pass);
};

document.getElementById('get-token').onclick = function(event) {
  event.preventDefault();
  firebase.auth().currentUser.getIdToken(true).
    then(token => document.getElementById('id-token').innerHTML = token);
};

document.getElementById('scan').onclick = async (event) => {
  event.preventDefault();
  const token = await firebase.auth().currentUser.getIdToken(true);
  const body = {
    query: `mutation {
      insert_scans(objects: {tracking_number: "${Math.random()}"}) {
        returning {
          tracking_number
        }
      }
    }`
  };
  const settings = {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
    };
  const response = await fetch('https://pp-api-dev.herokuapp.com/v1/graphql', settings);
  const json = await response.json();
  console.log(json);
};

function login(email, password) {
  firebase.auth().signInWithEmailAndPassword(email, password)
    .then(function(user) {
      console.log('login success');
    })
    .catch(function(error) {
      // Handle Errors here.
      var errorCode = error.code;
      var errorMessage = error.message;
      console.log(error);
    });

  let callback = null;
  let metadataRef = null;
  firebase.auth().onAuthStateChanged(user => {
    // Remove previous listener.
    if (callback) {
      metadataRef.off('value', callback);
    }
    // On user login add new listener.
    if (user) {
      // Check if refresh is required.
      metadataRef = firebase.database().ref('metadata/' + user.uid + '/refreshTime');
      callback = (snapshot) => {
        // Force refresh to pick up the latest custom claims changes.
        // Note this is always triggered on first call. Further optimization could be
        // added to avoid the initial trigger when the token is issued and already contains
        // the latest claims.
        user.getIdToken(true);
      };
      // Subscribe new listener to changes on that node.
      metadataRef.on('value', callback);
    }
  });
}
