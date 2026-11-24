
import {
    signInWithEmailAndPassword,
    signInWithPopup
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";

import {
    auth,
    googleProvider
} from "./firebase.js";

const formLogin = document.getElementById("formLogin");
const mensagem = document.getElementById("mensagemLogin");
const btnGoogle = document.getElementById("btnGoogle");

function mostrarMensagem(texto, tipo) {
    mensagem.textContent = texto;
    mensagem.className = `mensagem-formulario ${tipo}`;
}


// LOGIN COM E-MAIL E SENHA

formLogin.addEventListener("submit", async (event) => {

    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value;

    try {

        await signInWithEmailAndPassword(auth, email, senha);

        window.location.href = "index.html";

    } catch (erro) {

        console.error("Erro no login:", erro);

        if (
            erro.code === "auth/invalid-credential" ||
            erro.code === "auth/wrong-password" ||
            erro.code === "auth/user-not-found"
        ) {
            mostrarMensagem("E-mail ou senha incorretos.", "erro");

        } else if (erro.code === "auth/invalid-email") {
            mostrarMensagem("Digite um e-mail válido.", "erro");

        } else {
            mostrarMensagem("Não foi possível entrar. Tente novamente.", "erro");
        }
    }
});


// LOGIN COM GOOGLE

btnGoogle.addEventListener("click", async () => {

    try {

        await signInWithPopup(auth, googleProvider);

        window.location.href = "index.html";

    } catch (erro) {

        console.error("Erro no login com Google:", erro);

        if (erro.code === "auth/popup-closed-by-user") {
            mostrarMensagem("A janela de login foi fechada.", "erro");
        } else {
            mostrarMensagem("Não foi possível entrar com o Google.", "erro");
        }
    }
});
