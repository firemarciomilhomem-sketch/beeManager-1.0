
import {
    collection,
    addDoc,
    getDocs,
    getDocsFromCache,
    deleteDoc,
    doc,
    setDoc
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";

import {
  auth,
  db
} from "./firebase.js";

// =================================
// VARIÁVEIS
// =================================

let apiarios = [];
let apiarioParaExcluir = null;
let usuarioAtual = null;

// =================================
// FORMULÁRIO APIÁRIO
// =================================

function abrirFormulario() {
  document.getElementById("formApiario").classList.remove("escondido");
}

function fecharFormulario() {
  document.getElementById("formApiario").classList.add("escondido");
}

// =================================
// MODAL EXCLUSÃO
// =================================

function excluirApiario(id) {
  apiarioParaExcluir = id;

  document.getElementById("modalExcluir").classList.remove("escondido");
}

function fecharModalExcluir() {
  apiarioParaExcluir = null;

  document.getElementById("modalExcluir").classList.add("escondido");
}

// ATENÇÃO: A exclusão será migrada para o Firestore
// na próxima etapa. Por enquanto, não testar esse botão.

async function confirmarExclusao() {
    if (!apiarioParaExcluir || !usuarioAtual) return;

    try {
        const referencia = doc(
            db,
            "usuarios",
            usuarioAtual.uid,
            "apiarios",
            apiarioParaExcluir
        );

        await deleteDoc(referencia);

        fecharModalExcluir();

        await carregarApiarios(usuarioAtual.uid);

    } catch (erro) {
        console.error("Erro ao excluir apiário:", erro);
        alert("Não foi possível excluir o apiário.");
    }
}

// =================================
// ABRIR APIÁRIO
// =================================

function abrirApiario(id) {
  window.location.href = `apiario.html?id=${id}`;
}

// =================================
// CONTADOR DE APIÁRIOS
// =================================

function atualizarCardApiarios() {
  const card = document.getElementById("totalApiarios");

  if (card) {
    card.textContent = apiarios.length;
  }
}

function atualizarTotalCaixas() {
  let totalCaixas = 0;

  apiarios.forEach((apiario) => {
    if (Array.isArray(apiario.caixas)) {
      totalCaixas += apiario.caixas.length;
    }
  });

  const card = document.getElementById("totalCaixas");

  if (card) {
    card.textContent = totalCaixas;
  }
}

// =================================
// LISTAGEM DOS APIÁRIOS
// =================================

function renderizarApiarios() {
  const lista = document.getElementById("listaApiarios");

  if (!lista) return;

  lista.innerHTML = "";

  if (apiarios.length === 0) {
    lista.innerHTML = `
      <p>Nenhum apiário cadastrado.</p>
    `;

    atualizarCardApiarios();
    return;
  }

  apiarios.forEach((apiario) => {
    lista.innerHTML += `
      <div
        class="item-apiario"
        onclick="abrirApiario('${apiario.id}')">

        <button
          class="btn-excluir"
          onclick="event.stopPropagation(); excluirApiario('${apiario.id}')">

          ✖

        </button>

        <h3>${apiario.nome}</h3>

        <p>
          📍 ${apiario.endereco}
        </p>

      </div>
    `;
  });

  atualizarCardApiarios();
}

// =================================
// PRODUÇÃO TOTAL
// =================================

function atualizarProducaoTotal() {
  let totais = {
    mel: 0,
    polen: 0,
    propolis: 0,
    apitoxina: 0,
  };

  apiarios.forEach((apiario) => {
    if (!Array.isArray(apiario.caixas)) {
      return;
    }

    apiario.caixas.forEach((caixa) => {
      const producao = caixa.producao || {};

      totais.mel += Number(producao.mel) || 0;
      totais.polen += Number(producao.polen) || 0;
      totais.propolis += Number(producao.propolis) || 0;
      totais.apitoxina += Number(producao.apitoxina) || 0;
    });
  });

  const cardProducao = document.getElementById("totalProducao");

  if (cardProducao) {
    cardProducao.innerHTML = `
      <div>🍯 Mel: ${(totais.mel / 1000).toLocaleString("pt-BR")} kg</div>
      <div>🌼 Pólen: ${totais.polen.toLocaleString("pt-BR")} g</div>
      <div>🟤 Própolis: ${totais.propolis.toLocaleString("pt-BR")} g</div>
      <div>💧 Apitoxina: ${totais.apitoxina.toLocaleString("pt-BR")} g</div>
    `;
  }
}

// =================================
// SALVAR NOVO APIÁRIO
// =================================


const formulario = document.getElementById("novoApiario");

if (formulario) {
  formulario.addEventListener("submit", async function (event) {
    event.preventDefault();

    const usuario = usuarioAtual;

    if (!usuario) {
      alert("Você precisa estar conectado para cadastrar um apiário.");
      return;
    }

    const nome = document.getElementById("nomeApiario").value.trim();
    const endereco = document.getElementById("endereco").value.trim();

    const novoApiario = {
      nome: nome,
      endereco: endereco,
      caixas: [],
      ultimaVisita: null,
      intervaloInspecao: 30,
      dataCriacao: new Date().toISOString(),
    };

    try {
      const referenciaApiarios = collection(
        db,
        "usuarios",
        usuario.uid,
        "apiarios"
      );

      // Gera um ID imediatamente, sem esperar o servidor
      const referenciaNovoApiario = doc(referenciaApiarios);

      // Inicia a gravação no Firestore
      const gravacao = setDoc(
        referenciaNovoApiario,
        novoApiario
      );

      // Atualiza a interface imediatamente
      formulario.reset();
      fecharFormulario();

      await carregarApiarios(usuario.uid);

      // Acompanha a confirmação sem bloquear a interface
      gravacao.catch((erro) => {
        console.error("Erro ao sincronizar apiário:", erro);
      });

    } catch (erro) {
      console.error("Erro ao cadastrar apiário:", erro);
      alert("Não foi possível iniciar o cadastro do apiário.");
    }
  });
}


// =================================
// CONTADOR DE VISITAS ATRASADAS
// =================================

function atualizarVisitasAtrasadas() {
  const hoje = new Date().toLocaleDateString("en-CA");

  let totalAtrasadas = 0;

  apiarios.forEach((apiario) => {
    if (apiario.proximaVisita && apiario.proximaVisita < hoje) {
      totalAtrasadas++;
    }
  });

  const card = document.getElementById("totalVisitasAtrasadas");

  if (card) {
    card.textContent = totalAtrasadas;
  }
}

// =================================
// BUSCAR APIÁRIOS DO FIRESTORE
// =================================


async function carregarApiarios(uid) {
  try {
    const referenciaApiarios = collection(
      db,
      "usuarios",
      uid,
      "apiarios"
    );

    let consulta;

    if (navigator.onLine) {
      try {
        // Com internet: busca os dados atualizados
        consulta = await getDocs(referenciaApiarios);

      } catch (erroOnline) {
        console.warn("Falha na consulta online. Tentando o cache...", erroOnline);

        // Se falhar: tenta os dados armazenados localmente
        consulta = await getDocsFromCache(referenciaApiarios);
      }

    } else {
      // Sem internet: consulta diretamente o cache local
      consulta = await getDocsFromCache(referenciaApiarios);
    }

    apiarios = consulta.docs.map((documento) => ({
      id: documento.id,
      ...documento.data()
    }));

    renderizarApiarios();
    atualizarProducaoTotal();
    atualizarVisitasAtrasadas();
    atualizarTotalCaixas();

    console.log("Apiários carregados:", apiarios.length);

  } catch (erro) {
    console.error("Erro ao carregar apiários:", erro);

    alert(
      "Não foi possível carregar os apiários. Verifique sua conexão ou se os dados estão armazenados no dispositivo."
    );
  }
}


// =================================
// FUNÇÕES DISPONÍVEIS NO HTML
// =================================

window.abrirFormulario = abrirFormulario;
window.fecharFormulario = fecharFormulario;
window.excluirApiario = excluirApiario;
window.fecharModalExcluir = fecharModalExcluir;
window.confirmarExclusao = confirmarExclusao;
window.abrirApiario = abrirApiario;

// =================================
// INICIALIZAÇÃO COM FIREBASE
// =================================

onAuthStateChanged(auth, (usuario) => {
  if (!usuario) {
    usuarioAtual = null;
    apiarios = [];
    return;
  }

  usuarioAtual = usuario;

  carregarApiarios(usuario.uid);
});


// =================================
// SERVICE WORKER - PWA
// =================================

if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
        try {
            const registro = await navigator.serviceWorker.register(
                "./service-worker.js"
            );

            console.log("BeeManager offline ativado!", registro);

        } catch (erro) {
            console.error("Erro ao registrar Service Worker:", erro);
        }
    });
}
