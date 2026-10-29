/*
 * Funil pós-compra: upsell CPP → (downsell CPP Top 100) → upsell Legislação Especial → obrigado.
 *
 * Tudo o que precisa ser trocado fica neste bloco CONFIG.
 *  - checkout: link de pagamento de cada oferta (Kiwify, Hotmart, Lowify...).
 *  - entrega: link do material de cada produto, exibido na página de obrigado.
 *
 * Na plataforma, configure o redirecionamento "após compra aprovada" de cada produto
 * para a próxima página do funil, adicionando ?comprou=<id>. Exemplo:
 *   Código Penal básico   → https://SEUSITE/upsell-cpp.html?comprou=cp
 *   Código Penal premium  → https://SEUSITE/upsell-cpp.html?comprou=cp-premium
 *   CPP Explicado         → https://SEUSITE/upsell-legislacao.html?comprou=cpp
 *   CPP Top 100           → https://SEUSITE/upsell-legislacao.html?comprou=cpp-top100
 *   Legislação Especial   → https://SEUSITE/obrigado.html?comprou=lpe
 */
const CONFIG = {
  checkout: {
    cpp: "https://pay.wiapy.com/wfkR4BzRhOV6",
    "cpp-top100": "https://pay.wiapy.com/4sNdAIFP1omU",
    lpe: "https://pay.wiapy.com/qgPqG5tfaXoE",
  },
  entrega: {
    cp: { nome: "Código Penal Explicado", link: "#LINK-DO-PDF" },
    "cp-premium": { nome: "Código Penal Explicado: Pacote Premium (com bônus)", link: "#LINK-DO-PDF" },
    cpp: { nome: "Código de Processo Penal Explicado", link: "#LINK-DO-PDF" },
    "cpp-top100": { nome: "CPP: os 100 artigos mais cobrados", link: "#LINK-DO-PDF" },
    lpe: { nome: "Legislação Penal Especial Explicada", link: "#LINK-DO-PDF" },
  },
  suporte: {
    email: "direitodescomplica@gmail.com",
    whatsapp: "", // ex.: "5511999999999" (só números). Vazio esconde o botão.
  },
};

const CHAVE = "funil_compras";

function lerCompras() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE)) || [];
  } catch {
    return [];
  }
}

function salvarCompras(lista) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(lista));
  } catch {}
}

// Registra o que veio em ?comprou= (aceita vários separados por vírgula).
function registrarCompra() {
  const param = new URLSearchParams(location.search).get("comprou");
  const compras = lerCompras();
  if (param) {
    for (const id of param.split(",")) {
      if (CONFIG.entrega[id] && !compras.includes(id)) compras.push(id);
    }
    salvarCompras(compras);
  }
  return compras;
}

function ligarBotoes() {
  document.querySelectorAll("[data-checkout]").forEach((a) => {
    const url = CONFIG.checkout[a.dataset.checkout];
    if (url) a.href = url;
  });
}

function montarEntrega(compras) {
  const lista = document.getElementById("entregas");
  if (!lista) return;

  // O premium já inclui o básico.
  const itens = compras.filter((id) => !(id === "cp" && compras.includes("cp-premium")));

  if (!itens.length) {
    document.getElementById("sem-entregas").hidden = false;
    return;
  }

  for (const id of itens) {
    const { nome, link } = CONFIG.entrega[id];
    const li = document.createElement("li");
    li.className = "entrega";
    li.innerHTML = `
      <span class="entrega-icone" aria-hidden="true">📘</span>
      <span class="entrega-nome"></span>
      <a class="btn btn-verde btn-pequeno" target="_blank" rel="noopener">Baixar</a>`;
    li.querySelector(".entrega-nome").textContent = nome;
    li.querySelector("a").href = link;
    lista.appendChild(li);
  }

  const zap = document.getElementById("whatsapp");
  if (zap && CONFIG.suporte.whatsapp) {
    zap.href = `https://wa.me/${CONFIG.suporte.whatsapp}?text=${encodeURIComponent(
      "Oi! Acabei de comprar e quero receber meus materiais por aqui."
    )}`;
    zap.hidden = false;
  }
}

// Carrossel de páginas: anda devagar sozinho, com setas e botão de pausar.
// O trilho tem as páginas duplicadas; ao passar da metade, volta meia volta sem pulo.
function montarCarrosseis() {
  document.querySelectorAll(".carrossel").forEach((caixa) => {
    const trilho = caixa.querySelector(".carrossel-trilho");
    if (!trilho) return;
    const imgs = trilho.querySelectorAll("img");
    // Distância entre a 1ª página e a 1ª da cópia: é o tamanho exato de uma volta.
    const volta = () => imgs[imgs.length / 2].offsetLeft - imgs[0].offsetLeft;
    let pausado = false;
    let esperaAte = 0;
    const espera = (ms) => (esperaAte = performance.now() + ms);

    const ctrl = document.createElement("div");
    ctrl.className = "carrossel-ctrl";
    ctrl.innerHTML = `
      <button type="button" class="seta" aria-label="Página anterior">←</button>
      <button type="button" class="pausa">Pausar</button>
      <button type="button" class="seta" aria-label="Próxima página">→</button>`;
    caixa.after(ctrl);

    const [anterior, pausa, proxima] = ctrl.querySelectorAll("button");
    const anda = (direcao) => {
      const img = trilho.querySelector("img");
      const passo = img ? img.offsetWidth + parseFloat(getComputedStyle(trilho).columnGap || 16) : 256;
      if (direcao < 0 && trilho.scrollLeft < passo) trilho.scrollLeft += volta();
      espera(1800);
      trilho.scrollBy({ left: direcao * passo, behavior: "smooth" });
    };
    anterior.addEventListener("click", () => anda(-1));
    proxima.addEventListener("click", () => anda(1));
    pausa.addEventListener("click", () => {
      pausado = !pausado;
      pausa.textContent = pausado ? "Continuar" : "Pausar";
    });
    trilho.addEventListener("touchstart", () => espera(60000), { passive: true });
    trilho.addEventListener("touchend", () => espera(2500), { passive: true });
    trilho.addEventListener("wheel", () => espera(2500), { passive: true });

    let ultimo = performance.now();
    let sobra = 0;
    const tick = (agora) => {
      const dt = Math.min(agora - ultimo, 100);
      ultimo = agora;
      if (!pausado && agora > esperaAte) {
        sobra += dt * 0.032; // ~32 px por segundo
        const px = Math.floor(sobra);
        if (px) {
          trilho.scrollLeft += px;
          sobra -= px;
        }
        if (trilho.scrollLeft >= volta()) trilho.scrollLeft -= volta();
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const compras = registrarCompra();
  ligarBotoes();
  montarCarrosseis();
  montarEntrega(compras);
  document.querySelectorAll("[data-email]").forEach((el) => (el.textContent = CONFIG.suporte.email));
});
