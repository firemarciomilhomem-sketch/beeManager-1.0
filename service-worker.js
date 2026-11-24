
const CACHE_NAME = "beemanager-v2";

const ARQUIVOS = [
    "./",
    "./index.html",
    "./style.css",
    "./script.js",
    "./apiario.html",
    "./apiario.js",
    "./login.html",
    "./login.css",
    "./login.js",
    "./cadastro.html",
    "./cadastro.css",
    "./cadastro.js",
    "./firebase.js",
    "./protecao.js",
    "./usuario.js",
    "./manifest.json"
];

// Instalação: armazena os arquivos do aplicativo
self.addEventListener("install", (evento) => {
    evento.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ARQUIVOS);
        })
    );

    self.skipWaiting();
});

// Ativação: limpa caches antigos
self.addEventListener("activate", (evento) => {
    evento.waitUntil(
        caches.keys().then((nomes) => {
            return Promise.all(
                nomes
                    .filter((nome) => nome !== CACHE_NAME)
                    .map((nome) => caches.delete(nome))
            );
        })
    );

    self.clients.claim();
});

// Busca: utiliza arquivos armazenados quando necessário


self.addEventListener("fetch", (evento) => {
    if (evento.request.method !== "GET") return;

    const url = new URL(evento.request.url);

    // Armazena as bibliotecas do Firebase
    const firebaseSDK =
        url.hostname === "www.gstatic.com" &&
        url.pathname.startsWith("/firebasejs/");
if (firebaseSDK) {
    evento.respondWith(
        (async () => {
            const cache = await caches.open(CACHE_NAME);

            // PRIMEIRO: procura no cache
            const arquivoSalvo = await cache.match(evento.request);

            if (arquivoSalvo) {
                return arquivoSalvo;
            }

            // SEGUNDO: tenta buscar na internet
            try {
                const resposta = await fetch(evento.request);

                if (resposta.ok) {
                    await cache.put(evento.request, resposta.clone());
                }

                return resposta;

            } catch (erro) {
                console.error("Firebase indisponível:", erro);
                throw erro;
            }
        })()
    );

    return;
}

    // Não intercepta requisições externas ao BeeManager
    if (url.origin !== self.location.origin) {
        return;
    }

    // Arquivos locais: cache primeiro
    evento.respondWith(
        (async () => {
            const cache = await caches.open(CACHE_NAME);

            const arquivoSalvo = await cache.match(evento.request);

            if (arquivoSalvo) {
                return arquivoSalvo;
            }

            try {
                return await fetch(evento.request);

            } catch (erro) {
                // Se for uma página, tenta abrir o início do aplicativo
                if (evento.request.mode === "navigate") {
                    const paginaInicial = await cache.match("./index.html");

                    if (paginaInicial) {
                        return paginaInicial;
                    }
                }

                return new Response(
                    "Recurso indisponível no momento.",
                    {
                        status: 503,
                        headers: {
                            "Content-Type": "text/plain; charset=utf-8"
                        }
                    }
                );
            }
        })()
    );
});
