// Carrossel de depoimentos: anda sozinho (uma volta a cada 55s), dá para arrastar com o dedo
// (com embalo e encaixe suave no card) e tem os botões ← Pausar → (visual do carrossel de páginas: cp-pg-*).
// O trilho tem 2 grupos iguais; ao passar um grupo, volta sem pulo.
(function () {
  const DURACAO = 55;          // segundos por volta no automático
  const ESPERA = 3000;         // ms parado depois de mexer, antes de voltar a andar
  const ATRITO = 0.94;         // perda de velocidade por quadro (60fps) no embalo
  function iniciar(caixa) {
    const trilho = caixa.querySelector(".cp-dv-trilho");
    const grupo = () => trilho.querySelector(".cp-dv-grupo").offsetWidth;
    const passo = () => {
      const c = trilho.querySelector(".cp-dv-card");
      return c ? c.offsetWidth + parseFloat(getComputedStyle(c.parentElement).columnGap || 16) : 296;
    };
    // modo: "auto" | "arrasto" | "embalo" | "anim"
    let x = 0, modo = "auto", pausado = false, esperaAte = 0, ultimo = performance.now();
    let vAuto = 0, v = 0, anim = null;
    let toque = null; // {id, sx, sy, base, trava, amostras}

    // Mantém x dentro de um grupo; devolve quanto deslocou (para corrigir referências).
    const limitar = () => {
      const g = grupo(); if (!g) return 0; let d = 0;
      while (x <= -g) { x += g; d += g; }
      while (x > 0) { x -= g; d -= g; }
      return d;
    };
    const encaixar = (dur) => {
      const p = passo();
      anim = { de: x, para: Math.round(x / p) * p, t0: performance.now(), dur: dur || 380 };
      modo = "anim";
    };

    const quadro = (agora) => {
      const dt = Math.min(agora - ultimo, 64); ultimo = agora;
      if (modo === "anim") {
        const t = Math.min((agora - anim.t0) / anim.dur, 1);
        const e = 1 - Math.pow(1 - t, 3);
        x = anim.de + (anim.para - anim.de) * e;
        if (t === 1) { anim = null; modo = "auto"; limitar(); }
      } else if (modo === "embalo") {
        x += v * dt; limitar();
        v *= Math.pow(ATRITO, dt / 16.7);
        if (Math.abs(v) < 0.08) encaixar(420);
      } else if (modo === "auto") {
        // acelera e desacelera devagar (sem tranco ao pausar/voltar)
        const alvo = (!pausado && agora > esperaAte) ? grupo() / (DURACAO * 1000) : 0;
        vAuto += (alvo - vAuto) * Math.min(1, dt / 700);
        x -= vAuto * dt; limitar();
      }
      trilho.style.transform = "translate3d(" + x.toFixed(2) + "px,0,0)";
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
      if (anim) x = anim.para;
      const p = passo(), g = grupo();
      x = Math.round(x / p) * p;
      if (dir > 0 && x - p <= -g) x += g;
      if (dir < 0 && x + p > 0) x -= g;
      anim = { de: x, para: x - dir * p, t0: performance.now(), dur: 450 };
      modo = "anim"; vAuto = 0; esperaAte = performance.now() + ESPERA;
    };
    ant.addEventListener("click", () => anda(-1));
    prox.addEventListener("click", () => anda(1));
    pausa.addEventListener("click", () => {
      pausado = !pausado;
      pausa.textContent = pausado ? "Continuar" : "Pausar";
    });

    // Arrastar com o dedo ou o mouse: só "trava" no horizontal se o gesto for mais lateral que vertical;
    // se for vertical, deixa a página rolar normalmente.
    caixa.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (modo === "embalo" || modo === "anim") { anim = null; v = 0; modo = "auto"; } // segura no dedo
      vAuto = 0;
      toque = { id: e.pointerId, sx: e.clientX, sy: e.clientY, base: x, trava: null, amostras: [{ t: performance.now(), x }] };
    });
    caixa.addEventListener("pointermove", (e) => {
      if (!toque || e.pointerId !== toque.id) return;
      const dx = e.clientX - toque.sx, dy = e.clientY - toque.sy;
      if (!toque.trava) {
        if (Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(dy)) {
          toque.trava = "x"; modo = "arrasto"; caixa.classList.add("arrastando");
          try { caixa.setPointerCapture(e.pointerId); } catch (_) {}
        } else if (Math.abs(dy) > 6) { toque = null; return; }
        else return;
      }
      x = toque.base + dx;
      const d = limitar();
      if (d) { toque.base += d; toque.amostras.forEach((s) => { s.x += d; }); }
      const agora = performance.now();
      toque.amostras.push({ t: agora, x: toque.base + dx });
      while (toque.amostras.length > 2 && agora - toque.amostras[0].t > 100) toque.amostras.shift();
    });
    const soltar = (e) => {
      if (!toque || (e && e.pointerId !== toque.id)) return;
      const t = toque; toque = null;
      if (t.trava !== "x") return;
      caixa.classList.remove("arrastando");
      const a = t.amostras[0], b = t.amostras[t.amostras.length - 1];
      const dt = b.t - a.t;
      v = dt > 0 ? (b.x - a.x) / dt : 0;
      v = Math.max(-3, Math.min(3, v));
      esperaAte = performance.now() + ESPERA;
      // Um único movimento: projeta onde o embalo pararia e desliza até o card mais próximo dali,
      // começando na mesma velocidade do dedo e freando até parar.
      const p = passo(), g = grupo();
      let alvo = Math.round((x + v * 16.7 / (1 - ATRITO)) / p) * p;
      while (alvo > 0) { x -= g; alvo -= g; }
      while (alvo < -g) { x += g; alvo += g; }
      const dist = Math.abs(alvo - x);
      const dur = Math.max(320, Math.min(1100, (3 * dist) / Math.max(Math.abs(v), 0.35)));
      anim = { de: x, para: alvo, t0: performance.now(), dur };
      modo = "anim";
    };
    caixa.addEventListener("pointerup", soltar);
    caixa.addEventListener("pointercancel", soltar);
    caixa.addEventListener("lostpointercapture", soltar);
    caixa.addEventListener("dragstart", (e) => e.preventDefault());
    requestAnimationFrame(quadro);
  }
  // A página é montada pelo React depois do carregamento: espera o carrossel aparecer.
  const procurar = setInterval(() => {
    const caixa = document.querySelector(".cp-dv-carrossel");
    if (caixa) { clearInterval(procurar); iniciar(caixa); }
  }, 200);
})();
