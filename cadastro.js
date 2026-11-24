
import {
    createUserWithEmailAndPassword,
    updateProfile
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";

import { auth } from "./firebase.js";

const formCadastro = document.getElementById("formCadastro");
const mensagem = document.getElementById("mensagemCadastro");

function mostrarMensagem(texto, tipo) {
    mensagem.textContent = texto;
    mensagem.className = `mensagem-formulario ${tipo}`;
}

formCadastro.addEventListener("submit", async (event) => {

    event.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value;
    const confirmarSenha = document.getElementById("confirmarSenha").value;

    if (senha !== confirmarSenha) {
        mostrarMensagem("As senhas não são iguais.", "erro");
        return;
    }

    if (senha.length < 6) {
        mostrarMensagem("A senha precisa ter pelo menos 6 caracteres.", "erro");
        return;
    }

    try {

        const resultado = await createUserWithEmailAndPassword(
            auth,
            email,
            senha
        );

        await updateProfile(resultado.user, {
            displayName: nome
        });

        mostrarMensagem(
            "Conta criada com sucesso! Redirecionando...",
            "sucesso"
        );

        setTimeout(() => {
            window.location.href = "index.html";
        }, 1500);

    } catch (erro) {

        console.error("Erro no cadastro:", erro);

        if (erro.code === "auth/email-already-in-use") {
            mostrarMensagem("Este e-mail já possui uma conta.", "erro");

        } else if (erro.code === "auth/invalid-email") {
            mostrarMensagem("Digite um endereço de e-mail válido.", "erro");

        } else if (erro.code === "auth/weak-password") {
            mostrarMensagem("A senha é muito fraca. Utilize pelo menos 6 caracteres.", "erro");

        } else {
            mostrarMensagem("Não foi possível criar sua conta. Tente novamente.", "erro");
        }
    }
});
