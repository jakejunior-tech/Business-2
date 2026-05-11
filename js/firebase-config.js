const firebaseConfig = {
  apiKey: "AIzaSyCfiWZ1V_kjcwShi3hw8YQ5umuQYGhvg84",
  authDomain: "business-2-3e9fd.firebaseapp.com",
  databaseURL: "https://business-2-3e9fd-default-rtdb.firebaseio.com",
  projectId: "business-2-3e9fd",
  storageBucket: "business-2-3e9fd.firebasestorage.app",
  messagingSenderId: "471877458326",
  appId: "1:471877458326:web:b82b6a723a3f543e1e65b7"
};

firebase.initializeApp(firebaseConfig);
var db = firebase.firestore();
var auth = firebase.auth();

var CLOUDINARY_CONFIG = {
  cloudName: 'de7fyrtxe',
  uploadPreset: 'business_2'
};
