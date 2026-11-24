import {
  doc,
  getDoc,
  getDocFromCache,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";

import { auth, db } from "./firebase.js";

// =================================
// VARIÁVEIS
// =================================

const params = new URLSearchParams(window.location.search);
const id = params.get("id");

let usuarioAtual = null;
let apiario = null;

let caixaParaExcluir = null;
let caixaEditando = null;
let caixaColheita = null;

const dataVisita = document.getElementById("dataVisita");

// =================================
// REFERÊNCIA DO APIÁRIO NO FIRESTORE
// =================================

function referenciaApiario() {
  return doc(db, "usuarios", usuarioAtual.uid, "apiarios", id);
}

// =================================
// SALVAR ALTERAÇÕES NO FIRESTORE
// =================================

async function salvarApiario() {
  if (!usuarioAtual || !apiario) {
    throw new Error("Apiário ou usuário não disponível.");
  }

  await updateDoc(referenciaApiario(), {
    caixas: apiario.caixas,
    visitas: apiario.visitas,
    proximaVisita: apiario.proximaVisita,
  });
}

// =================================
// CARREGAR APIÁRIO
// =================================

async function carregarApiario() {
  console.time("Carregamento do apiário");

  try {
    if (!id) {
      alert("ID do apiário não informado.");
      window.location.href = "index.html";
      return;
    }

    const referencia = referenciaApiario();
    let resultado;

    // Sem internet: consulta diretamente o cache
    if (!navigator.onLine) {
      console.log("Carregando apiário pelo cache...");

      resultado = await getDocFromCache(referencia);
    } else {
      // Com internet: consulta normalmente
      resultado = await getDoc(referencia);
    }

    console.timeLog("Carregamento do apiário", "Documento obtido");

    if (!resultado.exists()) {
      alert("Apiário não encontrado.");
      window.location.href = "index.html";
      return;
    }

    apiario = {
      id: resultado.id,
      ...resultado.data(),
    };

    // Garantir estrutura dos dados
    if (!Array.isArray(apiario.caixas)) {
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

      if (!caixa.produz) {
        caixa.produz = {
          mel: false,
          propolis: false,
          polen: false,
          apitoxina: false,
        };
      }
    });

    // Exibir dados do apiário
    document.getElementById("nomeApiario").textContent = apiario.nome;
    document.getElementById("enderecoApiario").textContent = apiario.endereco;

    renderizarCaixas();

    console.timeLog("Carregamento do apiário", "Caixas renderizadas");

    atualizarProducaoApiario();
    mostrarProximaVisita();

    console.log("Apiário carregado com sucesso!");
  } catch (erro) {
    console.error("Erro ao carregar apiário:", erro);

    if (!navigator.onLine) {
      alert(
        "Não foi possível encontrar os dados deste apiário no cache. Conecte-se à internet e abra-o novamente para armazená-los.",
      );
    } else {
      alert("Não foi possível carregar os dados do apiário.");
    }
  } finally {
    console.timeEnd("Carregamento do apiário");
  }
}

// =================================
// TEXTO STATUS
// =================================

function textoStatus(status) {
  if (status === "forte") return "🐝 Forte";
  if (status === "media") return "🟡 Média";

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

// =================================
// RENDERIZAR CAIXAS
// =================================

function renderizarCaixas() {
  const lista = document.getElementById("listaCaixas");
  const totalCaixas = document.getElementById("totalCaixas");

  if (!lista || !totalCaixas || !apiario) return;

  totalCaixas.textContent = apiario.caixas.length;
  lista.innerHTML = "";

  if (apiario.caixas.length === 0) {
    lista.innerHTML = "<p>Nenhuma caixa cadastrada.</p>";
    return;
  }

  apiario.caixas.forEach((caixa) => {
    lista.innerHTML += `
            <div class="caixa">

                <div class="topo">

                    <h2>${caixa.nome}</h2>

                    <div class="cabecalho-direita">

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

                    </div>

                </div>

                <div class="linha-status">

                    <p class="produzindo">
                        🌿 Produzindo:
                        ${textoProduz(caixa)}
                    </p>

                    <span class="status-caixa ${caixa.status}">
                        Colmeia: ${textoStatus(caixa.status)}
                    </span>

                </div>

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

// =================================
// PRÓXIMA VISITA
// =================================

function mostrarProximaVisita() {
  const elemento = document.getElementById("dataProximaVisita");

  if (!elemento || !apiario) return;

  if (apiario.proximaVisita) {
    const dataFormatada = new Date(
      `${apiario.proximaVisita}T00:00:00`,
    ).toLocaleDateString("pt-BR");

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

// =================================
// MODAL NOVA CAIXA
// =================================

function abrirModalCaixa() {
  document.getElementById("modalCaixa").classList.remove("escondido");
}

function fecharModalCaixa() {
  document.getElementById("modalCaixa").classList.add("escondido");
}

// =================================
// CADASTRAR / EDITAR CAIXA
// =================================

const formNovaCaixa = document.getElementById("formNovaCaixa");

if (formNovaCaixa) {
  formNovaCaixa.addEventListener("submit", async function (event) {
    event.preventDefault();

    if (!apiario) return;

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

    try {
      // Inicia a gravação sem bloquear a interface
      const gravacao = salvarApiario();

      // Atualiza a tela imediatamente
      formNovaCaixa.reset();
      fecharModalCaixa();

      renderizarCaixas();
      atualizarProducaoApiario();

      // Acompanha possíveis erros de sincronização
      gravacao.catch((erro) => {
        console.error("Erro ao sincronizar caixa:", erro);
      });
    } catch (erro) {
      console.error("Erro ao salvar caixa:", erro);
      alert("Não foi possível iniciar o salvamento da caixa.");
    }
  });
}

// =================================
// MODAL COLHEITA
// =================================

function abrirModalColheita(idCaixa) {
  caixaColheita = apiario.caixas.find((caixa) => caixa.id === idCaixa);

  if (!caixaColheita) return;

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
    if (caixaColheita.produz?.[produto.chave]) {
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

// =================================
// MODAL EXCLUIR CAIXA
// =================================

function abrirModalExcluirCaixa(idCaixa) {
  caixaParaExcluir = apiario.caixas.find((caixa) => caixa.id === idCaixa);

  if (!caixaParaExcluir) return;

  document.getElementById("textoExcluirCaixa").textContent =
    `Deseja realmente excluir "${caixaParaExcluir.nome}"?`;

  document.getElementById("modalExcluirCaixa").classList.remove("escondido");
}

function fecharModalExcluirCaixa() {
  caixaParaExcluir = null;

  document.getElementById("modalExcluirCaixa").classList.add("escondido");
}

function confirmarExclusaoCaixa() {
  if (!caixaParaExcluir || !apiario) return;

  const idExcluido = caixaParaExcluir.id;

  apiario.caixas = apiario.caixas.filter((caixa) => caixa.id !== idExcluido);

  try {
    const gravacao = salvarApiario();

    // Atualiza a interface imediatamente
    fecharModalExcluirCaixa();

    renderizarCaixas();
    atualizarProducaoApiario();

    // Observa possíveis erros de sincronização
    gravacao.catch((erro) => {
      console.error("Erro ao sincronizar exclusão:", erro);
    });
  } catch (erro) {
    console.error("Erro ao excluir caixa:", erro);
    alert("Não foi possível iniciar a exclusão da caixa.");
  }
}

// =================================
// SALVAR COLHEITA
// =================================

const formColheita = document.getElementById("formColheita");

if (formColheita) {
  formColheita.addEventListener("submit", async function (event) {
    event.preventDefault();

    const produto = document.getElementById("produtoColheita").value;

    const quantidade = Number(
      document.getElementById("quantidadeColheita").value,
    );

    if (!caixaColheita || !produto || quantidade <= 0) {
      return;
    }

    const quantidadeEmGramas =
      produto === "mel" ? quantidade * 1000 : quantidade;

    caixaColheita.producao[produto] += quantidadeEmGramas;

    try {
      // Inicia a gravação sem esperar o servidor
      const gravacao = salvarApiario();

      // Atualiza a interface imediatamente
      renderizarCaixas();
      atualizarProducaoApiario();

      formColheita.reset();

      document.getElementById("unidadeColheita").textContent = "Kg";

      fecharModalColheita();

      // Acompanha possíveis erros de sincronização
      gravacao.catch((erro) => {
        console.error("Erro ao sincronizar colheita:", erro);
      });
    } catch (erro) {
      console.error("Erro ao salvar colheita:", erro);
      alert("Não foi possível iniciar o salvamento da colheita.");
    }
  });
}

// =================================
// EDITAR CAIXA
// =================================

function editarCaixa(idCaixa) {
  caixaEditando = apiario.caixas.find((caixa) => caixa.id === idCaixa);

  if (!caixaEditando) return;

  document.getElementById("nomeCaixa").value = caixaEditando.nome;

  document.getElementById("melgueiras").value = caixaEditando.melgueiras;

  document.getElementById("realeiras").value = caixaEditando.realeiras || 0;

  document.getElementById("alimentador").value =
    caixaEditando.alimentador.toString();

  document.getElementById("rainha").value = caixaEditando.rainha.toString();

  document.getElementById("statusCaixa").value = caixaEditando.status;

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

// =================================
// PRODUÇÃO
// =================================

function atualizarProducaoApiario() {
  if (!apiario) return;

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

// =================================
// UNIDADE DA COLHEITA
// =================================

const produtoColheita = document.getElementById("produtoColheita");

if (produtoColheita) {
  produtoColheita.addEventListener("change", function () {
    const unidade = document.getElementById("unidadeColheita");

    unidade.textContent = produtoColheita.value === "mel" ? "Kg" : "g";
  });
}

// =================================
// MODAL AGENDAR VISITA
// =================================

function abrirModalVisita() {
  document.getElementById("modalVisita").classList.remove("escondido");
}

function fecharModalVisita() {
  document.getElementById("modalVisita").classList.add("escondido");
}

const formVisita = document.getElementById("formVisita");

if (formVisita) {
  formVisita.addEventListener("submit", async function (event) {
    event.preventDefault();

    if (!apiario) return;

    const dataEscolhida = dataVisita.value;

    if (!dataEscolhida) return;

    apiario.proximaVisita = dataEscolhida;

    try {
      // Inicia a gravação sem esperar o servidor
      const gravacao = salvarApiario();

      // Atualiza a interface imediatamente
      fecharModalVisita();
      mostrarProximaVisita();

      // Acompanha possíveis erros de sincronização
      gravacao.catch((erro) => {
        console.error("Erro ao sincronizar visita:", erro);
      });
    } catch (erro) {
      console.error("Erro ao agendar visita:", erro);
      alert("Não foi possível iniciar o agendamento da visita.");
    }
  });
}

// =================================
// FUNÇÕES DISPONÍVEIS NO HTML
// =================================

window.abrirModalCaixa = abrirModalCaixa;
window.fecharModalCaixa = fecharModalCaixa;
window.abrirModalColheita = abrirModalColheita;
window.fecharModalColheita = fecharModalColheita;
window.abrirModalExcluirCaixa = abrirModalExcluirCaixa;
window.fecharModalExcluirCaixa = fecharModalExcluirCaixa;
window.confirmarExclusaoCaixa = confirmarExclusaoCaixa;
window.editarCaixa = editarCaixa;
window.abrirModalVisita = abrirModalVisita;
window.fecharModalVisita = fecharModalVisita;

console.time("Autenticação Firebase");

onAuthStateChanged(auth, async (usuario) => {
  console.timeLog("Autenticação Firebase", "Estado de autenticação recebido");

  if (!usuario) {
    usuarioAtual = null;
    apiario = null;
    return;
  }

  usuarioAtual = usuario;

  await carregarApiario();
});
