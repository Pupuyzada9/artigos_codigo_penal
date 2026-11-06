// Carrossel de depoimentos: anda sozinho (uma volta a cada 55s), dá para arrastar,
// e tem os botões ← Pausar → (mesmo visual do carrossel de páginas: classes cp-pg-*).
// O trilho tem 2 grupos iguais; ao passar um grupo, volta sem pulo.
(function () {
  const DURACAO = 55;
  function iniciar(caixa) {
    const trilho = caixa.querySelector(".cp-dv-trilho");
    const grupo = () => trilho.querySelector(".cp-dv-grupo").offsetWidth;
    const passo = () => {
      const c = trilho.querySelector(".cp-dv-card");
      return c ? c.offsetWidth + parseFloat(getComputedStyle(c.parentElement).columnGap || 16) : 296;
    };
    let x = 0, pausado = false, arrastando = false, inicioX = 0, inicioPos = 0;
    let ultimo = performance.now(), esperaAte = 0, anim = null;
    const limitar = () => { const g = grupo(); if (!g) return; while (x <= -g) x += g; while (x > 0) x -= g; };

    const quadro = (agora) => {
      const dt = Math.min(agora - ultimo, 100); ultimo = agora;
      if (anim) {
        const t = Math.min((agora - anim.t0) / 450, 1);
        const e = 1 - Math.pow(1 - t, 3);
        x = anim.de + (anim.para - anim.de) * e;
        if (t === 1) { anim = null; limitar(); }
      } else if (!arrastando && !pausado && agora > esperaAte) {
        x -= (grupo() / (DURACAO * 1000)) * dt; limitar();
      }
      trilho.style.transform = "translate3d(" + x + "px,0,0)";
      requestAnimationFrame(quadro);
    };

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
      if (anim) { x = anim.para; anim = null; }
      if (dir > 0 && x - passo() <= -grupo()) x += grupo();
      if (dir < 0 && x + passo() > 0) x -= grupo();
      anim = { de: x, para: x - dir * passo(), t0: performance.now() };
      esperaAte = performance.now() + 2500;
    };
    ant.addEventListener("click", () => anda(-1));
    prox.addEventListener("click", () => anda(1));
    pausa.addEventListener("click", () => {
      pausado = !pausado;
      pausa.textContent = pausado ? "Continuar" : "Pausar";
    });

    // Arrastar com dedo ou mouse
    caixa.addEventListener("pointerdown", (e) => {
      anim = null; arrastando = true; inicioX = e.clientX; inicioPos = x;
      caixa.classList.add("arrastando"); caixa.setPointerCapture(e.pointerId);
    });
    caixa.addEventListener("pointermove", (e) => { if (arrastando) { x = inicioPos + (e.clientX - inicioX); limitar(); } });
    const soltar = () => { if (!arrastando) return; arrastando = false; esperaAte = performance.now() + 2500; caixa.classList.remove("arrastando"); };
    caixa.addEventListener("pointerup", soltar);
    caixa.addEventListener("pointercancel", soltar);
    caixa.addEventListener("dragstart", (e) => e.preventDefault());
    requestAnimationFrame(quadro);
  }
  // A página é montada pelo React depois do carregamento: espera o carrossel aparecer.
  const procurar = setInterval(() => {
    const caixa = document.querySelector(".cp-dv-carrossel");
    if (caixa) { clearInterval(procurar); iniciar(caixa); }
  }, 200);
})();
