// =========================
// OBTER ID DO APIÁRIO
// =========================

const dataVisita = document.getElementById("dataVisita");

const params = new URLSearchParams(window.location.search);

const id = Number(params.get("id"));

const apiarios = JSON.parse(localStorage.getItem("apiarios")) || [];

const apiario = apiarios.find((a) => a.id === id);

let caixaParaExcluir = null;
let caixaEditando = null;
let caixaColheita = null;

// =========================
// VALIDAR APIÁRIO
// =========================

if (!apiario) {
  alert("Apiário não encontrado.");

  window.location.href = "index.html";
}

// =========================
// GARANTIR ESTRUTURA
// =========================

if (!apiario.caixas) {
  apiario.caixas = [];
}
if (!Array.isArray(apiario.visitas)) {
  apiario.visitas = [];
}

if (!apiario.proximaVisita) {
  apiario.proximaVisita = null;
}
apiario.caixas.forEach((caixa) => {
  if (
    !caixa.producao ||
    typeof caixa.producao !== "object" ||
    Array.isArray(caixa.producao)
  ) {
    caixa.producao = {
      mel: 0,
      polen: 0,
      propolis: 0,
      apitoxina: 0,
    };
  } else {
    caixa.producao.mel = Number(caixa.producao.mel) || 0;

    caixa.producao.polen = Number(caixa.producao.polen) || 0;

    caixa.producao.propolis = Number(caixa.producao.propolis) || 0;

    caixa.producao.apitoxina = Number(caixa.producao.apitoxina) || 0;
  }

  caixa.producaoEmGramas = true;
});

localStorage.setItem("apiarios", JSON.stringify(apiarios));

// =========================
// EXIBIR DADOS
// =========================

document.getElementById("nomeApiario").textContent = apiario.nome;

document.getElementById("enderecoApiario").textContent = apiario.endereco;

// =========================
// TEXTO STATUS
// =========================

function textoStatus(status) {
  if (status === "forte") {
    return "🐝 Forte";
  }

  if (status === "media") {
    return "🟡 Média";
  }

  return "🔴 Fraca";
}
function textoProduz(caixa) {
  const produtos = [];

  if (caixa.produz?.mel) produtos.push("Mel");

  if (caixa.produz?.propolis) produtos.push("Própolis");

  if (caixa.produz?.polen) produtos.push("Pólen");

  if (caixa.produz?.apitoxina) produtos.push("Apitoxina");

  return produtos.join(", ");
}

// =========================
// RENDERIZAR CAIXAS
// =========================

function renderizarCaixas() {
  const lista = document.getElementById("listaCaixas");

  const totalCaixas = document.getElementById("totalCaixas");

  totalCaixas.textContent = apiario.caixas.length;

  lista.innerHTML = "";

  if (apiario.caixas.length === 0) {
    lista.innerHTML = "<p>Nenhuma caixa cadastrada.</p>";

    return;
  }

  apiario.caixas.forEach((caixa) => {
    lista.innerHTML += `

            <div class="caixa">

                <div class="acoes-caixa">

                <button
    class="btn-colheita"
    onclick="abrirModalColheita(${caixa.id})">

    🍯

</button>

    <button
        class="btn-editar"
        onclick="editarCaixa(${caixa.id})">

        ✏️

    </button>

    <button
        class="btn"
        onclick="abrirModalExcluirCaixa(${caixa.id})">

        ×

    </button>

</div>

                <span class="status-caixa ${caixa.status}">
                    ${textoStatus(caixa.status)}
                </span>

                <div class="topo">

    <h2>${caixa.nome}</h2>

</div>

<p class="produzindo">

    🌿 Produzindo:
    ${textoProduz(caixa)}

</p>
 <div class="badges">

                    <span class="info melgueira">
                        📦 Melgueiras: ${caixa.melgueiras}
                    </span>

                    <span class="info alimentador">
                        🥤 Alimentador:
                        ${caixa.alimentador ? "Sim" : "Não"}
                    </span>
                    <span class="info realeiras">
    👑 Realeiras: ${caixa.realeiras || 0}
</span>

                    <span class="info realeira">
                        👑 Rainha:
                        ${caixa.rainha ? "Sim" : "Não"}
                    </span>

                    <div class="info producao">
    🍯 Produção:
    <div>
        ${listarProducao(caixa)}
    </div>
</div>

                </div>

            </div>

        `;
  });
}

function mostrarProximaVisita() {
  const elemento = document.getElementById("dataProximaVisita");

  if (apiario.proximaVisita) {
    const dataFormatada = new Date(apiario.proximaVisita).toLocaleDateString(
      "pt-BR",
    );

    const agora = new Date();

    const ano = agora.getFullYear();

    const mes = String(agora.getMonth() + 1).padStart(2, "0");

    const dia = String(agora.getDate()).padStart(2, "0");

    const hoje = `${ano}-${mes}-${dia}`;

    if (apiario.proximaVisita < hoje) {
      elemento.textContent = "⚠️ Visita atrasada!";
    } else if (apiario.proximaVisita === hoje) {
      elemento.textContent = "📅 Visita prevista para hoje!";
    } else {
      elemento.textContent = dataFormatada;
    }
  } else {
    elemento.textContent = "Nenhuma visita agendada.";
  }
}

// =========================
// MODAL NOVA CAIXA
// =========================

function abrirModalCaixa() {
  document.getElementById("modalCaixa").classList.remove("escondido");
}

function fecharModalCaixa() {
  document.getElementById("modalCaixa").classList.add("escondido");
}

// =========================
// CADASTRAR NOVA CAIXA
// =========================

const formNovaCaixa = document.getElementById("formNovaCaixa");

if (formNovaCaixa) {
  formNovaCaixa.addEventListener("submit", function (event) {
    event.preventDefault();

    if (caixaEditando) {
      caixaEditando.nome = document.getElementById("nomeCaixa").value;

      caixaEditando.melgueiras = Number(
        document.getElementById("melgueiras").value,
      );

      caixaEditando.realeiras =
        Number(document.getElementById("realeiras").value) || 0;

      caixaEditando.alimentador =
        document.getElementById("alimentador").value === "true";

      caixaEditando.rainha = document.getElementById("rainha").value === "true";

      caixaEditando.status = document.getElementById("statusCaixa").value;

      caixaEditando.produz = {
        mel: document.getElementById("prodMel").checked,
        propolis: document.getElementById("prodPropolis").checked,
        polen: document.getElementById("prodPolen").checked,
        apitoxina: document.getElementById("prodApitoxina").checked,
      };

      caixaEditando = null;
    } else {
      const novaCaixa = {
        id: Date.now(),

        nome: document.getElementById("nomeCaixa").value,

        melgueiras: Number(document.getElementById("melgueiras").value),
        realeiras: Number(document.getElementById("realeiras").value) || 0,

        alimentador: document.getElementById("alimentador").value === "true",

        rainha: document.getElementById("rainha").value === "true",

        producao: {
          mel: 0,
          propolis: 0,
          polen: 0,
          apitoxina: 0,
        },

        producaoEmGramas: true,

        status: document.getElementById("statusCaixa").value,

        produz: {
          mel: document.getElementById("prodMel").checked,

          propolis: document.getElementById("prodPropolis").checked,

          polen: document.getElementById("prodPolen").checked,

          apitoxina: document.getElementById("prodApitoxina").checked,
        },
      };

      apiario.caixas.push(novaCaixa);
    }

    localStorage.setItem("apiarios", JSON.stringify(apiarios));

    formNovaCaixa.reset();

    fecharModalCaixa();

    renderizarCaixas();
  });
}
// =========================
// MODAL COLHEITA
// =========================

function abrirModalColheita(id) {
  caixaColheita = apiario.caixas.find((caixa) => caixa.id === id);
  console.log("Caixa selecionada:", caixaColheita);
  console.log("Produção:", caixaColheita.producao);

  document.getElementById("nomeCaixaColheita").textContent = caixaColheita.nome;

  const produtoSelect = document.getElementById("produtoColheita");

  produtoSelect.innerHTML = '<option value="">Selecione o produto</option>';

  const produtos = [
    { chave: "mel", nome: "Mel" },
    { chave: "polen", nome: "Pólen" },
    { chave: "propolis", nome: "Própolis" },
    { chave: "apitoxina", nome: "Apitoxina" },
  ];

  produtos.forEach((produto) => {
    if (caixaColheita.produz[produto.chave]) {
      const opcao = document.createElement("option");

      opcao.value = produto.chave;
      opcao.textContent = produto.nome;

      produtoSelect.appendChild(opcao);
    }
  });

  document.getElementById("modalColheita").classList.remove("escondido");
}

function fecharModalColheita() {
  caixaColheita = null;

  document.getElementById("modalColheita").classList.add("escondido");
}

// =========================
// MODAL EXCLUIR CAIXA
// =========================

function abrirModalExcluirCaixa(id) {
  caixaParaExcluir = apiario.caixas.find((caixa) => caixa.id === id);

  document.getElementById("textoExcluirCaixa").textContent =
    `Deseja realmente excluir "${caixaParaExcluir.nome}"?`;

  document.getElementById("modalExcluirCaixa").classList.remove("escondido");
}

function fecharModalExcluirCaixa() {
  caixaParaExcluir = null;

  document.getElementById("modalExcluirCaixa").classList.add("escondido");
}

function confirmarExclusaoCaixa() {
  apiario.caixas = apiario.caixas.filter(
    (caixa) => caixa.id !== caixaParaExcluir.id,
  );

  localStorage.setItem("apiarios", JSON.stringify(apiarios));

  fecharModalExcluirCaixa();

  renderizarCaixas();

  atualizarProducaoApiario();
}
// =========================
// SALVAR COLHEITA
// =========================

const formColheita = document.getElementById("formColheita");

if (formColheita) {
  formColheita.addEventListener("submit", function (event) {
    event.preventDefault();

    const produto = document.getElementById("produtoColheita").value;

    const quantidade = Number(
      document.getElementById("quantidadeColheita").value,
    );

    if (!caixaColheita || !produto || quantidade <= 0) {
      return;
    }

    // Converte mel de Kg para gramas
    const quantidadeEmGramas =
      produto === "mel" ? quantidade * 1000 : quantidade;

    // Soma no produto escolhido
    caixaColheita.producao[produto] += quantidadeEmGramas;

    localStorage.setItem("apiarios", JSON.stringify(apiarios));

    renderizarCaixas();

    atualizarProducaoApiario();

    formColheita.reset();

    document.getElementById("unidadeColheita").textContent = "Kg";

    fecharModalColheita();
  });
}

// =========================
// INICIALIZAÇÃO
// =========================

renderizarCaixas();
function editarCaixa(id) {
  caixaEditando = apiario.caixas.find((caixa) => caixa.id === id);

  document.getElementById("nomeCaixa").value = caixaEditando.nome;

  document.getElementById("melgueiras").value = caixaEditando.melgueiras;

  document.getElementById("realeiras").value = caixaEditando.realeiras || 0;

  document.getElementById("alimentador").value =
    caixaEditando.alimentador.toString();

  document.getElementById("rainha").value = caixaEditando.rainha.toString();

  document.getElementById("statusCaixa").value = caixaEditando.status;

  // CHECKBOXES DE PRODUÇÃO
  document.getElementById("prodMel").checked =
    caixaEditando.produz?.mel || false;

  document.getElementById("prodPropolis").checked =
    caixaEditando.produz?.propolis || false;

  document.getElementById("prodPolen").checked =
    caixaEditando.produz?.polen || false;

  document.getElementById("prodApitoxina").checked =
    caixaEditando.produz?.apitoxina || false;

  abrirModalCaixa();
}

// PRODUÇÃO

function atualizarProducaoApiario() {
  let total = 0;

  apiario.caixas.forEach((caixa) => {
    total += Number(caixa.producao?.mel) || 0;
  });

  document.getElementById("totalMel").textContent =
    `${(total / 1000).toLocaleString("pt-BR")} Kg`;
}

function textoProducao(caixa) {
  const produtos = [];

  if (caixa.produz?.mel) produtos.push("Mel");

  if (caixa.produz?.propolis) produtos.push("Própolis");

  if (caixa.produz?.polen) produtos.push("Pólen");

  if (caixa.produz?.apitoxina) produtos.push("Apitoxina");

  return produtos.join(", ");
}

function listarProducao(caixa) {
  const producao = caixa.producao || {};

  const produtos = [
    { nome: "Mel", valor: producao.mel, unidade: "kg", divisor: 1000 },
    { nome: "Pólen", valor: producao.polen, unidade: "g", divisor: 1 },
    { nome: "Própolis", valor: producao.propolis, unidade: "g", divisor: 1 },
    { nome: "Apitoxina", valor: producao.apitoxina, unidade: "g", divisor: 1 },
  ];

  const registrados = produtos.filter((produto) => Number(produto.valor) > 0);

  if (registrados.length === 0) {
    return "Nenhuma colheita registrada.";
  }

  return registrados
    .map((produto) => {
      const quantidade = Number(produto.valor) / produto.divisor;

      return `${produto.nome}: ${quantidade.toLocaleString("pt-BR")} ${produto.unidade}`;
    })
    .join("<br>");
}

const produtoColheita = document.getElementById("produtoColheita");

produtoColheita.addEventListener("change", function () {
  const unidade = document.getElementById("unidadeColheita");

  if (produtoColheita.value === "mel") {
    unidade.textContent = "Kg";
  } else {
    unidade.textContent = "g";
  }
});
// =========================
// MODAL DE AGENDAR VISITA
// =========================

function abrirModalVisita() {
  document.getElementById("modalVisita").classList.remove("escondido");
}
function fecharModalVisita() {
  document.getElementById("modalVisita").classList.add("escondido");
}

document
  .getElementById("formVisita")
  .addEventListener("submit", function (event) {
    event.preventDefault();

    const dataEscolhida = dataVisita.value;

    apiario.proximaVisita = dataEscolhida;

    localStorage.setItem("apiarios", JSON.stringify(apiarios));

    fecharModalVisita();

    console.log(apiario);
  });

renderizarCaixas();

atualizarProducaoApiario();

mostrarProximaVisita();
