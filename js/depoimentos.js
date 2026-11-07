// Carrossel de depoimentos com rolagem NATIVA (o dedo desliza com o mesmo embalo da rolagem vertical).
// O script só faz: andar sozinho devagar, dar a volta infinita e os botões ← Pausar →.
// O trilho tem 2 grupos iguais; ao passar um grupo, volta sem pulo.
(function () {
  const DURACAO = 55;   // segundos por volta no automático
  const ESPERA = 3000;  // ms parado depois que a pessoa mexe
  function iniciar(caixa) {
    const trilho = caixa.querySelector(".cp-dv-trilho");
    trilho.style.transform = "none";
    const grupo = () => trilho.querySelector(".cp-dv-grupo").offsetWidth;
    const passo = () => {
      const c = trilho.querySelector(".cp-dv-card");
      return c ? c.offsetWidth + parseFloat(getComputedStyle(c.parentElement).columnGap || 16) : 296;
    };
    let pausado = false, tocando = false, esperaAte = 0, ultimo = performance.now();
    let pos = 0, esperado = 0, vel = 0;

    const colocar = (v) => { pos = v; caixa.scrollLeft = v; esperado = caixa.scrollLeft; };
    // começa no meio do primeiro grupo, para dar para arrastar para os dois lados
    const comecar = () => { const g = grupo(); if (g) colocar(Math.round(g / 2)); };
    comecar();

    // volta infinita: só reposiciona quando ninguém está com o dedo na tela
    const dobrar = () => {
      const g = grupo(); if (!g) return;
      const s = caixa.scrollLeft;
      if (s > g * 1.5) colocar(s - g);
      else if (s < g * 0.25) colocar(s + g);
    };

    const quadro = (agora) => {
      const dt = Math.min(agora - ultimo, 64); ultimo = agora;
      const alvo = (!pausado && !tocando && agora > esperaAte) ? grupo() / (DURACAO * 1000) : 0;
      vel += (alvo - vel) * Math.min(1, dt / 700); // acelera/desacelera devagar
      if (vel > 0.0005) {
        pos += vel * dt;
        caixa.scrollLeft = pos;
        esperado = caixa.scrollLeft;
        dobrar();
      }
      requestAnimationFrame(quadro);
    };

    // Qualquer rolagem que não foi o automático = a pessoa mexeu: pausa e sincroniza.
    caixa.addEventListener("scroll", () => {
      if (Math.abs(caixa.scrollLeft - esperado) > 1.5) {
        esperaAte = performance.now() + ESPERA;
        vel = 0;
        pos = caixa.scrollLeft;
        esperado = pos;
      }
    }, { passive: true });
    caixa.addEventListener("touchstart", () => { tocando = true; vel = 0; }, { passive: true });
    const soltar = () => { tocando = false; esperaAte = performance.now() + ESPERA; };
    caixa.addEventListener("touchend", soltar, { passive: true });
    caixa.addEventListener("touchcancel", soltar, { passive: true });
    // quando o embalo do dedo termina, reposiciona para a volta infinita
    let parado;
    caixa.addEventListener("scroll", () => {
      clearTimeout(parado);
      parado = setTimeout(() => { if (!tocando) { dobrar(); pos = caixa.scrollLeft; } }, 160);
    }, { passive: true });

    // Mouse (computador): arrastar segurando o botão
    let arr = null;
    caixa.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      arr = { x: e.clientX, s: caixa.scrollLeft };
      caixa.classList.add("arrastando");
    });
    window.addEventListener("pointermove", (e) => {
      if (!arr) return;
      caixa.scrollLeft = arr.s - (e.clientX - arr.x);
    });
    window.addEventListener("pointerup", () => {
      if (!arr) return;
      arr = null; caixa.classList.remove("arrastando");
      esperaAte = performance.now() + ESPERA; dobrar(); pos = caixa.scrollLeft;
    });
    caixa.addEventListener("dragstart", (e) => e.preventDefault());

    // Botões ← Pausar →
    const ctrl = document.createElement("div");
    ctrl.className = "cp-pg-ctrl cp-dv-ctrl";
    ctrl.innerHTML =
      '<button type="button" class="cp-pg-seta" aria-label="Depoimento anterior">←</button>' +
      '<button type="button" class="cp-pg-pausa">Pausar</button>' +
      '<button type="button" class="cp-pg-seta" aria-label="Próximo depoimento">→</button>';
    caixa.after(ctrl);
    const [ant, pausa, prox] = ctrl.querySelectorAll("button");
    const anda = (dir) => {
      dobrar();
      const p = passo();
      const alvo = Math.round(caixa.scrollLeft / p) * p + dir * p;
      esperaAte = performance.now() + ESPERA; vel = 0;
      caixa.scrollTo({ left: alvo, behavior: "smooth" });
    };
    ant.addEventListener("click", () => anda(-1));
    prox.addEventListener("click", () => anda(1));
    pausa.addEventListener("click", () => {
      pausado = !pausado;
      pausa.textContent = pausado ? "Continuar" : "Pausar";
    });

    window.addEventListener("resize", () => { dobrar(); pos = caixa.scrollLeft; });
    requestAnimationFrame(quadro);
  }
  // A página é montada pelo React depois do carregamento: espera o carrossel aparecer.
  const procurar = setInterval(() => {
    const caixa = document.querySelector(".cp-dv-carrossel");
    if (caixa && caixa.querySelector(".cp-dv-grupo").offsetWidth) { clearInterval(procurar); iniciar(caixa); }
  }, 200);
})();
