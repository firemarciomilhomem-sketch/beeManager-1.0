// =================================
// VARIÁVEIS
// =================================

let apiarios = JSON.parse(localStorage.getItem("apiarios")) || [];

let apiarioParaExcluir = null;

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

function confirmarExclusao() {
  apiarios = apiarios.filter((apiario) => apiario.id !== apiarioParaExcluir);

  localStorage.setItem("apiarios", JSON.stringify(apiarios));

  renderizarApiarios();

  atualizarProducaoTotal();

  atualizarTotalCaixas();

  atualizarVisitasAtrasadas();

  fecharModalExcluir();
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
                onclick="abrirApiario(${apiario.id})">

                <button
                    class="btn-excluir"
                    onclick="event.stopPropagation(); excluirApiario(${apiario.id})">

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
  formulario.addEventListener("submit", function (event) {
    event.preventDefault();

    const nome = document.getElementById("nomeApiario").value;

    const endereco = document.getElementById("endereco").value;

    const novoApiario = {
      id: Date.now(),

      nome: nome,

      endereco: endereco,

      caixas: [],

      ultimaVisita: null,

      intervaloInspecao: 30,

      dataCriacao: new Date().toISOString(),
    };

    apiarios.push(novoApiario);

    localStorage.setItem("apiarios", JSON.stringify(apiarios));

    formulario.reset();

    fecharFormulario();

    renderizarApiarios();
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
// INICIALIZAÇÃO
// =================================

renderizarApiarios();

atualizarProducaoTotal();

atualizarVisitasAtrasadas();

atualizarTotalCaixas();
