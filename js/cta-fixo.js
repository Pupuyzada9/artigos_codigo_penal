// Botão fixo no rodapé do celular: aparece depois do topo e some quando
// as ofertas (ou o fim da página) estão na tela.
(function () {
  function iniciar() {
    var ofertas = document.getElementById("ofertas");
    if (!ofertas) return setTimeout(iniciar, 300); // a página é montada pelo React

    var barra = document.createElement("div");
    barra.className = "cp-fixo";
    barra.innerHTML = '<a href="#ofertas">Quero o meu <small>a partir de R$ 10</small></a>';
    document.body.appendChild(barra);

    barra.querySelector("a").addEventListener("click", function (e) {
      e.preventDefault();
      ofertas.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    var ofertasVisivel = false;
    new IntersectionObserver(function (es) {
      ofertasVisivel = es[0].isIntersecting;
      atualizar();
    }).observe(ofertas);

    function atualizar() {
      var passouTopo = window.scrollY > window.innerHeight * 0.9;
      var depoisDasOfertas = ofertas.getBoundingClientRect().bottom < 0;
      barra.classList.toggle("on", passouTopo && !ofertasVisivel && !depoisDasOfertas);
    }
    window.addEventListener("scroll", atualizar, { passive: true });
    atualizar();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();
