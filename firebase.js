

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js";

import {
    initializeAuth,
    browserLocalPersistence,
    GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";

import {
    initializeFirestore,
    persistentLocalCache,
    persistentMultipleTabManager
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js";


// CONFIGURAÇÃO DO FIREBASE

const firebaseConfig = {
    apiKey: "AIzaSyC_0z6OgcSm6O5cVAr6214RulAtWkP8cmQ",
    authDomain: "beemanager-69896.firebaseapp.com",
    projectId: "beemanager-69896",
    storageBucket: "beemanager-69896.firebasestorage.app",
    messagingSenderId: "415516396420",
    appId: "1:415516396420:web:6a66c6807a14b2ee2eabd1"
};


// INICIALIZAR FIREBASE

const app = initializeApp(firebaseConfig);


// AUTENTICAÇÃO

console.time("Inicialização Firebase Auth");

export const auth = initializeAuth(app, {
    persistence: browserLocalPersistence
});

console.timeEnd("Inicialização Firebase Auth");

console.time("Verificação da persistência");

auth.authStateReady().then(() => {
    console.timeEnd("Verificação da persistência");
});

auth.authStateReady().then(() => {
    console.timeEnd("Verificação da persistência");
});

export const googleProvider = new GoogleAuthProvider();

// BANCO DE DADOS COM CACHE OFFLINE

export const db = initializeFirestore(app, {
    localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
    })
});
