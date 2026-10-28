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
    cpp: "#COLE-AQUI-O-CHECKOUT-DO-CPP",
    "cpp-top100": "#COLE-AQUI-O-CHECKOUT-DO-CPP-TOP-100",
    lpe: "#COLE-AQUI-O-CHECKOUT-DA-LEGISLACAO-ESPECIAL",
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

document.addEventListener("DOMContentLoaded", () => {
  const compras = registrarCompra();
  ligarBotoes();
  montarEntrega(compras);
  document.querySelectorAll("[data-email]").forEach((el) => (el.textContent = CONFIG.suporte.email));
});
