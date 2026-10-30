// Gera a página /policial (js/policial.js) a partir do bundle principal, trocando só os textos.
// Mesmos produtos, checkouts, upsells e pixel; a copy fala com quem vai prestar PM, PC e PRF.
// Uso: node scripts/gerar-policial.js   (rode de novo sempre que o bundle principal mudar)
const fs = require("fs");
const path = require("path");
const raiz = path.join(__dirname, "..");
let s = fs.readFileSync(path.join(raiz, "js/index-2CjdRaMa.js"), "utf8");

function troca(antigo, novo) {
  const n = s.split(antigo).length - 1;
  if (n !== 1) throw new Error(`esperava 1 ocorrência, achei ${n}: ${antigo.slice(0, 80)}`);
  s = s.replace(antigo, () => novo);
}

// Topo
troca('"Código Penal Explicado 2026"', '"Concurso Policial 2026"');
troca(
  'children:["Os 361 artigos do Código Penal ",E.jsx("span",{className:"text-red-600",children:"explicados de forma simples"})]',
  'children:["O Código Penal da sua prova de PM, PC e PRF ",E.jsx("span",{className:"text-red-600",children:"explicado de forma simples"})]'
);
troca(
  '"Em português do dia a dia, sem precisar de faculdade de Direito."',
  '"Os 361 artigos em português do dia a dia, sem precisar de faculdade de Direito."'
);

// Por que fica fácil
troca('"FEITO PARA CONCURSOS"', '"FEITO PARA CONCURSO POLICIAL"');
troca(
  '"Pensado para acertar questões de prova, não para advogados."',
  '"Pensado para acertar questões de prova, como as de PM, PC e PRF."'
);
troca(
  '"Ainda hoje você vai começar a entender o Código Penal sem complicação."',
  '"Ainda hoje você começa a dominar a matéria que separa você da farda."'
);

// Para quem é
troca('"Abre o Código Penal e trava"', '"Vai prestar PM, PC ou PRF e trava no Código Penal"');

// Ofertas
troca(
  '"Tudo o que você precisa para dominar o Código Penal, em um acesso só."',
  '"Tudo o que você precisa para dominar Direito Penal no concurso policial, em um acesso só."'
);

// FAQ
troca('"Serve para concursos e OAB?"', '"Serve para PM, PC e PRF?"');
troca(
  '"Sim. Cada artigo mostra o nível de cobrança em provas, as bancas que mais cobram e a pegadinha de concurso em destaque."',
  '"Sim. Direito Penal cai nos concursos policiais, e cada artigo mostra o nível de cobrança em provas, as bancas que mais cobram e a pegadinha em destaque. Confira no edital do seu concurso quais artigos são cobrados."'
);

// Final
troca('"As horas de estudo passam. "', '"A farda não espera. "');
troca('"O que você entende do Código Penal fica com você."', '"Comece hoje a dominar o Código Penal da sua prova."');

fs.writeFileSync(path.join(raiz, "js/policial.js"), s);
console.log("js/policial.js gerado");
