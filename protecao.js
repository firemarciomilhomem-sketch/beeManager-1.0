
import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";

import { auth } from "./firebase.js";

import { registrarUsuario } from "./usuario.js";

// ============================
// PROTEGER AS PÁGINAS
// ============================

// MEDIR TEMPO ATÉ A AUTENTICAÇÃO

console.time("Tempo até autenticação");

onAuthStateChanged(auth, async (usuario) => {

  console.timeEnd("Tempo até autenticação");

  // VERIFICAR AUTENTICAÇÃO

  if (!usuario) {
    window.location.replace("login.html");
    return;
  }

  // REGISTRAR OU ATUALIZAR USUÁRIO NO FIRESTORE

  console.time("Registro do usuário");

  // SINCRONIZAR USUÁRIO EM SEGUNDO PLANO

  registrarUsuario(usuario)
    .then(() => {
      console.timeEnd("Registro do usuário");
      console.log("Usuário sincronizado com o Firestore.");
    })
    .catch((erro) => {
      console.timeEnd("Registro do usuário");
      console.error("Erro ao registrar usuário:", erro);
    });

  // EXIBIR NOME NO DASHBOARD

  const mensagemUsuario = document.getElementById("mensagemUsuario");

  if (mensagemUsuario) {
    const nome = usuario.displayName || usuario.email;

    mensagemUsuario.textContent = `🐝 Bem-vindo, ${nome}! É bom ter você por aqui.`;
  }
});

// ============================
// BOTÃO SAIR
// ============================

const btnSair = document.querySelector(".btn-sair");

if (btnSair) {
  btnSair.addEventListener("click", async () => {
    try {
      await signOut(auth);
      window.location.replace("login.html");
    } catch (erro) {
      console.error("Erro ao sair:", erro);
      alert("Não foi possível sair da conta.");
    }
  });
}
