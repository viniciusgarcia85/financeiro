// =============================================
//  SISTEMA FINANCEIRO — VINÍCIUS
//  app.js — Lógica principal
// =============================================

import { db, auth } from './firebase.js';
import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc,
  query, orderBy, onSnapshot, setDoc, getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// =============================================
//  DADOS INICIAIS
// =============================================
const DIVIDAS_INIT = [
  // Fora da folha
  { id: 'outros-b',    nome: 'Outros B',        total: 3240.00, orig: 3240.00, pago: 0, vence: '20/07/2026', urg: 'red',   tipo: 'fora' },
  { id: 'recarga-pay', nome: 'Recarga Pay',      total: 1070.75, orig: 1070.75, pago: 0, vence: '22/07/2026', urg: 'red',   tipo: 'fora' },
  { id: 'mp-a',        nome: 'Mercado Pago A',   total: 2068.57, orig: 2068.57, pago: 0, vence: '29/07/2026', urg: 'red',   tipo: 'fora' },
  { id: 'mp-c',        nome: 'Mercado Pago C',   total: 448.56,  orig: 448.56,  pago: 0, vence: '06/08/2026', urg: 'red',   tipo: 'fora' },
  { id: 'mp-d',        nome: 'Mercado Pago D',   total: 966.90,  orig: 966.90,  pago: 0, vence: '10/08/2026', urg: 'amber', tipo: 'fora' },
  { id: 'outros-c',    nome: 'Outros C',         total: 300.00,  orig: 300.00,  pago: 0, vence: '10/08/2026', urg: 'amber', tipo: 'fora' },
  { id: 'outros-d',    nome: 'Outros D',         total: 375.00,  orig: 375.00,  pago: 0, vence: '10/08/2026', urg: 'amber', tipo: 'fora' },
  { id: 'mp-b',        nome: 'Mercado Pago B',   total: 713.10,  orig: 713.10,  pago: 0, vence: '17/08/2026', urg: 'amber', tipo: 'fora' },
  { id: 'outros-efg',  nome: 'Outros E/F/G',     total: 3600.00, orig: 3600.00, pago: 0, vence: '10/01/2027', urg: 'green', tipo: 'fora' },
  { id: 'outros-a',    nome: 'Outros A (mãe)',   total: 13269.90,orig: 13269.90,pago: 0, vence: 'Mensal',     urg: 'blue',  tipo: 'fora' },
  // PicPay — folha
  { id: 'pp-a', nome: 'PicPay A', total: 17356.50, orig: 17356.50, pago: 0, parcela: 385.70, vence: 'Folha', urg: 'gray', tipo: 'picpay', parcelas: 45 },
  { id: 'pp-b', nome: 'PicPay B', total: 10166.85, orig: 10166.85, pago: 0, parcela: 199.35, vence: 'Folha', urg: 'gray', tipo: 'picpay', parcelas: 51 },
  { id: 'pp-c', nome: 'PicPay C', total: 7509.84,  orig: 7509.84,  pago: 0, parcela: 192.56, vence: 'Folha', urg: 'gray', tipo: 'picpay', parcelas: 39 },
];

const CATS_INIT = {
  entrada: [
    'Salário CLT', 'Adiantamento (dia 20)', 'Vale Alimentação',
    'Petshop — R$200', 'Petshop — R$300', 'Renda Extra — IA',
    'Renda Extra — Afiliado', 'Renda Extra — Comissão', '13º Salário', 'Férias', 'Outros'
  ],
  saida: [
    'Fatura cartão', 'Gastos de casa', 'Alimentação', 'Transporte',
    'Saúde / Dentista', 'Academia', 'Barbearia', 'Celular', 'Internet',
    'Apostas ⚠', 'Lazer', 'Outros'
  ]
};

const METAS_DEF = [
  { id: 'dividas',  nome: 'Quitar todas as dívidas', alvo: 61052.06, cor: 'red',
    desc: 'Eliminar os R$ 26.052 fora da folha + PicPay. A fundação de tudo.',
    acoes: ['Negociar imediatamente dívidas de julho', 'Usar sobra extra 100% nas dívidas', 'Nunca contrair novo empréstimo em fintech'],
    evitar: ['Apostas', 'Parcelar coisas novas no cartão', 'Ignorar cobranças'] },
  { id: 'reserva', nome: 'Reserva de emergência R$ 10.000', alvo: 10000, cor: 'purple',
    desc: 'Seu escudo. Sem ela, qualquer imprevisto vira nova dívida. Guardar em CDB liquidez diária.',
    acoes: ['Guardar R$ 200/mês nas semanas de R$300 no petshop', 'Todo 13º vai direto para reserva'],
    evitar: ['Usar reserva para consumo', 'Deixar parado na poupança'] },
  { id: 'meta50k', nome: 'Juntar R$ 50.000', alvo: 50000, cor: 'blue',
    desc: 'Com dívidas zeradas e renda extra, acumular em 2–3 anos. CDB + FIIs.',
    acoes: ['Manter negócio de IA gerando R$ 2.000+/mês', 'Investir em FIIs', 'Reinvestir 100% dos rendimentos'],
    evitar: ['Inflacionar padrão de vida', 'Risco antes de ter base'] },
  { id: 'meta100k', nome: 'Juntar R$ 100.000', alvo: 100000, cor: 'accent',
    desc: 'O ponto de virada. FIIs gerando R$ 700–900/mês passivos.',
    acoes: ['FIIs: renda passiva de R$ 700–900/mês', 'Carteira: 60% renda fixa + 40% variável'],
    evitar: ['Concentrar em único ativo', 'Resgatar para consumo antes da meta'] },
];

// =============================================
//  ESTADO GLOBAL
// =============================================
let currentUser = null;
let userRef = null;
let dividas = [];
let transacoes = [];
let cats = { entrada: [], saida: [] };
let desafios = [];
let metasProg = {};
let currentTheme = 'dark';
let histFiltro = 'todos';

// =============================================
//  UTILS
// =============================================
const fmt = v => 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const today = () => new Date().toISOString().split('T')[0];
const fmtD = d => {
  if (!d) return '—';
  if (d.includes('-')) { const p = d.split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }
  return d;
};

function toast(msg, type = 'ok') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'show ' + type;
  setTimeout(() => t.className = '', 3500);
}

function setLoading(show) {
  document.getElementById('loading').style.display = show ? 'flex' : 'none';
}

// =============================================
//  AUTH
// =============================================
window.loginGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  } catch (e) {
    toast('Erro ao fazer login: ' + e.message, 'err');
  }
};

window.logout = async () => {
  await signOut(auth);
};

onAuthStateChanged(auth, async user => {
  setLoading(true);
  if (user) {
    currentUser = user;
    userRef = doc(db, 'users', user.uid);
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app').style.display = 'block';

    // Avatar
    const av = document.getElementById('nav-avatar');
    if (user.photoURL) {
      av.outerHTML = `<img src="${user.photoURL}" class="nav-avatar" onclick="logout()" title="Sair" id="nav-avatar">`;
    } else {
      av.textContent = user.displayName?.charAt(0) || 'V';
    }

    // Config user
    document.getElementById('cfg-user-info').textContent = `Logado como: ${user.displayName} (${user.email})`;

    await initUser();
    setLoading(false);
  } else {
    currentUser = null;
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('app').style.display = 'none';
    setLoading(false);
  }
});

// =============================================
//  INIT USER
// =============================================
async function initUser() {
  // Carregar config
  const cfgDoc = await getDoc(doc(db, 'users', currentUser.uid, 'config', 'prefs'));
  if (cfgDoc.exists()) {
    const cfg = cfgDoc.data();
    if (cfg.theme) setTheme(cfg.theme, false);
  }

  // Inicializar dívidas se não existirem
  const divSnap = await getDocs(collection(db, 'users', currentUser.uid, 'dividas'));
  if (divSnap.empty) {
    for (const d of DIVIDAS_INIT) {
      await setDoc(doc(db, 'users', currentUser.uid, 'dividas', d.id), d);
    }
  }

  // Inicializar categorias
  const catsDoc = await getDoc(doc(db, 'users', currentUser.uid, 'config', 'categorias'));
  if (!catsDoc.exists()) {
    await setDoc(doc(db, 'users', currentUser.uid, 'config', 'categorias'), CATS_INIT);
  }

  // Inicializar metas_prog
  const metasDoc = await getDoc(doc(db, 'users', currentUser.uid, 'config', 'metas'));
  if (!metasDoc.exists()) {
    await setDoc(doc(db, 'users', currentUser.uid, 'config', 'metas'), { reserva: 0, meta50k: 0, meta100k: 0 });
  }

  await loadAll();
  listenTransacoes();
  listenDividas();
}

// =============================================
//  LOAD ALL
// =============================================
async function loadAll() {
  await Promise.all([loadDividas(), loadCats(), loadDesafios(), loadMetas()]);
  renderDash();
  renderDividas();
  renderMetas();
  renderDesafios();
  renderCats();
  renderDivSelect();
  renderCatSelects();
  initForms();
}

async function loadDividas() {
  const snap = await getDocs(collection(db, 'users', currentUser.uid, 'dividas'));
  dividas = snap.docs.map(d => ({ ...d.data(), _docId: d.id }));
}

async function loadCats() {
  const snap = await getDoc(doc(db, 'users', currentUser.uid, 'config', 'categorias'));
  if (snap.exists()) cats = snap.data();
  else cats = JSON.parse(JSON.stringify(CATS_INIT));
}

async function loadDesafios() {
  const snap = await getDocs(query(collection(db, 'users', currentUser.uid, 'desafios'), orderBy('criadoEm', 'desc')));
  desafios = snap.docs.map(d => ({ ...d.data(), _docId: d.id }));
}

async function loadMetas() {
  const snap = await getDoc(doc(db, 'users', currentUser.uid, 'config', 'metas'));
  if (snap.exists()) metasProg = snap.data();
  else metasProg = { reserva: 0, meta50k: 0, meta100k: 0 };
}

// =============================================
//  LISTENERS TEMPO REAL
// =============================================
function listenTransacoes() {
  const q = query(collection(db, 'users', currentUser.uid, 'transacoes'), orderBy('data', 'desc'));
  onSnapshot(q, snap => {
    transacoes = snap.docs.map(d => ({ ...d.data(), _docId: d.id }));
    renderDash();
    renderHist(histFiltro);
  });
}

function listenDividas() {
  onSnapshot(collection(db, 'users', currentUser.uid, 'dividas'), snap => {
    dividas = snap.docs.map(d => ({ ...d.data(), _docId: d.id }));
    renderDividas();
    renderDash();
    renderMetas();
    renderDivSelect();
  });
}

// =============================================
//  NAVIGATION
// =============================================
window.goPage = (id) => {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach((b, i) => {
    const ids = ['dashboard', 'controle', 'dividas', 'metas', 'desafios', 'relatorios', 'config'];
    b.classList.toggle('active', ids[i] === id);
  });
  document.getElementById('page-' + id)?.classList.add('active');
  window.scrollTo(0, 0);
};

// =============================================
//  TABS
// =============================================
window.switchTab = (group, id) => {
  const panel = document.getElementById(id);
  if (!panel) return;
  const parent = panel.closest('.container') || panel.parentElement;
  parent.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  parent.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  panel.classList.add('active');
  const allPanels = parent.querySelectorAll('.tab-panel');
  const allTabs = parent.querySelectorAll('.tab');
  allPanels.forEach((p, i) => { if (p === panel && allTabs[i]) allTabs[i].classList.add('active'); });
  if (id === 't-hist') renderHist(histFiltro);
  if (id === 't-cats') renderCats();
};

// =============================================
//  THEME
// =============================================
window.setTheme = (theme, save = true) => {
  document.documentElement.setAttribute('data-theme', theme);
  currentTheme = theme;
  document.querySelectorAll('.theme-btn').forEach((b, i) => {
    b.classList.toggle('active', ['dark', 'clean', 'corporate'][i] === theme);
  });
  ['dark', 'clean', 'corporate'].forEach(t => {
    document.getElementById('cfg-' + t)?.classList.toggle('btn-p', t === theme);
    document.getElementById('cfg-' + t)?.classList.toggle('btn-g', t !== theme);
  });
  if (save && currentUser) {
    setDoc(doc(db, 'users', currentUser.uid, 'config', 'prefs'), { theme });
  }
};

// =============================================
//  FORMS INIT
// =============================================
function initForms() {
  const inputs = ['e-data', 's-data', 'n-data', 'pd-data', 'rv-data'];
  inputs.forEach(id => { const el = document.getElementById(id); if (el) el.value = today(); });

  // Greeting
  const h = new Date().getHours();
  const gr = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  const el = document.getElementById('dash-greeting');
  if (el) el.textContent = `${gr}, Vinícius 👋`;
}

function renderCatSelects() {
  const ecat = document.getElementById('e-cat');
  const scat = document.getElementById('s-cat');
  if (ecat) ecat.innerHTML = cats.entrada.map(c => `<option value="${c}">${c}</option>`).join('');
  if (scat) scat.innerHTML = cats.saida.map(c => `<option value="${c}">${c}</option>`).join('');
}

function renderDivSelect() {
  const divs = dividas.filter(d => !d.quitada);
  const html = divs.map(d => `<option value="${d.id}">${d.nome} — ${fmt(d.total)}</option>`).join('');
  ['n-div', 'pd-div', 'des-div'].forEach(id => {
    const el = document.getElementById(id); if (el) el.innerHTML = html;
  });
}

// =============================================
//  REGISTRAR ENTRADA
// =============================================
window.regEntrada = async () => {
  const cat = document.getElementById('e-cat').value;
  const val = parseFloat(document.getElementById('e-val').value);
  const data = document.getElementById('e-data').value || today();
  const desc = document.getElementById('e-desc').value;
  if (!val || val <= 0) { toast('Informe um valor válido', 'err'); return; }
  try {
    await addDoc(collection(db, 'users', currentUser.uid, 'transacoes'), {
      tipo: 'entrada', cat, label: cat, val, data, desc, criadoEm: Date.now()
    });
    clearForm('entrada');
    toast('✓ Entrada registrada!');
  } catch (e) { toast('Erro: ' + e.message, 'err'); }
};

// =============================================
//  REGISTRAR SAÍDA
// =============================================
window.regSaida = async () => {
  const cat = document.getElementById('s-cat').value;
  const val = parseFloat(document.getElementById('s-val').value);
  const data = document.getElementById('s-data').value || today();
  const desc = document.getElementById('s-desc').value;
  if (!val || val <= 0) { toast('Informe um valor válido', 'err'); return; }
  if (cat.includes('Apostas')) toast('⚠ Aposta registrada. Cada R$ apostado atrasa sua liberdade.', 'warn');
  try {
    await addDoc(collection(db, 'users', currentUser.uid, 'transacoes'), {
      tipo: 'saida', cat, label: cat, val, data, desc, criadoEm: Date.now()
    });
    clearForm('saida');
    if (!cat.includes('Apostas')) toast('Saída registrada.');
  } catch (e) { toast('Erro: ' + e.message, 'err'); }
};

// =============================================
//  REGISTRAR NEGOCIAÇÃO
// =============================================
window.regNegoc = async () => {
  const divId = document.getElementById('n-div').value;
  const res = document.getElementById('n-res').value;
  const parc = parseFloat(document.getElementById('n-parc').value) || 0;
  const qtd = parseInt(document.getElementById('n-qtd').value) || 0;
  const obs = document.getElementById('n-obs').value;
  const data = document.getElementById('n-data').value || today();
  const div = dividas.find(d => d.id === divId);
  if (!div) return;
  const resLabels = { parcelada: 'Renegociada em parcelas', desconto: 'Desconto obtido', prazo: 'Prazo estendido', recusada: 'Credor recusou', aguardando: 'Aguardando' };
  try {
    // Atualizar total da dívida
    if (res !== 'recusada' && res !== 'aguardando' && parc > 0 && qtd > 0) {
      const novoTotal = parc * qtd;
      const economia = div.total - novoTotal;
      await updateDoc(doc(db, 'users', currentUser.uid, 'dividas', divId), {
        total: novoTotal, negociada: true, novaParcela: parc, novaQtd: qtd, economia: Math.max(0, economia)
      });
      toast(`✓ Dívida renegociada! Novo total: ${fmt(novoTotal)}${economia > 0 ? ' (economia: ' + fmt(economia) + ')' : ''}`);
    } else {
      await updateDoc(doc(db, 'users', currentUser.uid, 'dividas', divId), { negociada: true });
      toast('Negociação registrada.');
    }
    await addDoc(collection(db, 'users', currentUser.uid, 'transacoes'), {
      tipo: 'negociacao', divida: div.nome, resultado: res, resLabel: resLabels[res], parc, qtd, obs, data, criadoEm: Date.now()
    });
    clearForm('negoc');
  } catch (e) { toast('Erro: ' + e.message, 'err'); }
};

// =============================================
//  REGISTRAR PAGAMENTO DÍVIDA
// =============================================
window.regPagDiv = async () => {
  const divId = document.getElementById('pd-div').value;
  const val = parseFloat(document.getElementById('pd-val').value);
  const data = document.getElementById('pd-data').value || today();
  const obs = document.getElementById('pd-obs').value;
  if (!val || val <= 0) { toast('Informe um valor válido', 'err'); return; }
  const div = dividas.find(d => d.id === divId);
  if (!div) return;
  const novoPago = (div.pago || 0) + val;
  const novoTotal = Math.max(0, div.total - val);
  const updates = { pago: novoPago, total: novoTotal };
  if (novoTotal <= 0) { updates.quitada = true; updates.dataQuit = data; }
  try {
    await updateDoc(doc(db, 'users', currentUser.uid, 'dividas', divId), updates);
    await addDoc(collection(db, 'users', currentUser.uid, 'transacoes'), {
      tipo: 'pag-divida', divida: div.nome, label: 'Pagamento — ' + div.nome, val, data, obs, criadoEm: Date.now()
    });
    clearForm('pagdiv');
    if (novoTotal <= 0) toast('🎉 ' + div.nome + ' QUITADA!');
    else toast(`✓ ${fmt(val)} pago em ${div.nome}. Restante: ${fmt(novoTotal)}`);
  } catch (e) { toast('Erro: ' + e.message, 'err'); }
};

// =============================================
//  QUITAR DÍVIDA MANUALMENTE
// =============================================
window.quitarDivida = async (id) => {
  const div = dividas.find(d => d.id === id);
  if (!div) return;
  try {
    await updateDoc(doc(db, 'users', currentUser.uid, 'dividas', id), { quitada: true, dataQuit: today() });
    await addDoc(collection(db, 'users', currentUser.uid, 'transacoes'), {
      tipo: 'quitada', divida: div.nome, label: 'Quitada — ' + div.nome, val: div.orig, data: today(), criadoEm: Date.now()
    });
    toast('🎉 ' + div.nome + ' quitada!');
  } catch (e) { toast('Erro: ' + e.message, 'err'); }
};

window.reativarDivida = async (id) => {
  try {
    await updateDoc(doc(db, 'users', currentUser.uid, 'dividas', id), { quitada: false, dataQuit: null });
    toast('Dívida reativada.');
  } catch (e) { toast('Erro: ' + e.message, 'err'); }
};

// =============================================
//  RESERVA
// =============================================
window.regReserva = async () => {
  const val = parseFloat(document.getElementById('rv-val').value);
  const data = document.getElementById('rv-data').value || today();
  const obs = document.getElementById('rv-obs').value;
  if (!val || val <= 0) { toast('Informe um valor válido', 'err'); return; }
  try {
    metasProg.reserva = (metasProg.reserva || 0) + val;
    await setDoc(doc(db, 'users', currentUser.uid, 'config', 'metas'), metasProg);
    await addDoc(collection(db, 'users', currentUser.uid, 'transacoes'), {
      tipo: 'reserva', label: 'Reserva de emergência', val, data, obs, criadoEm: Date.now()
    });
    clearForm('reserva');
    toast(`✓ ${fmt(val)} adicionado à reserva. Total: ${fmt(metasProg.reserva)}`);
    renderMetas();
  } catch (e) { toast('Erro: ' + e.message, 'err'); }
};

// =============================================
//  CATEGORIAS
// =============================================
window.addCat = async (tipo) => {
  const input = document.getElementById('new-cat-' + tipo);
  const nome = input.value.trim();
  if (!nome) return;
  if (!cats[tipo]) cats[tipo] = [];
  cats[tipo].push(nome);
  await setDoc(doc(db, 'users', currentUser.uid, 'config', 'categorias'), cats);
  input.value = '';
  renderCats();
  renderCatSelects();
  toast('Categoria adicionada!');
};

window.editCat = (tipo, idx) => {
  document.getElementById('editcat-nome').value = cats[tipo][idx];
  document.getElementById('editcat-id').value = idx;
  document.getElementById('editcat-tipo').value = tipo;
  document.getElementById('modal-editcat').classList.add('open');
};

window.salvarEditCat = async () => {
  const nome = document.getElementById('editcat-nome').value.trim();
  const idx = parseInt(document.getElementById('editcat-id').value);
  const tipo = document.getElementById('editcat-tipo').value;
  if (!nome) return;
  cats[tipo][idx] = nome;
  await setDoc(doc(db, 'users', currentUser.uid, 'config', 'categorias'), cats);
  closeModal();
  renderCats();
  renderCatSelects();
  toast('Categoria atualizada!');
};

window.deleteCat = async (tipo, idx) => {
  cats[tipo].splice(idx, 1);
  await setDoc(doc(db, 'users', currentUser.uid, 'config', 'categorias'), cats);
  renderCats();
  renderCatSelects();
  toast('Categoria removida.');
};

function renderCats() {
  ['entrada', 'saida'].forEach(tipo => {
    const el = document.getElementById('cats-' + tipo);
    if (!el) return;
    el.innerHTML = cats[tipo].map((c, i) => `
      <div class="cat-item">
        <span>${c}</span>
        <div class="cat-item-actions">
          <button class="btn btn-g btn-sm" onclick="editCat('${tipo}',${i})">✏</button>
          <button class="btn btn-d btn-sm" onclick="deleteCat('${tipo}',${i})">×</button>
        </div>
      </div>`).join('');
  });
}

// =============================================
//  DESAFIOS
// =============================================
window.criarDesafio = async () => {
  const nome = document.getElementById('des-nome').value.trim();
  const divId = document.getElementById('des-div').value;
  const meta = parseFloat(document.getElementById('des-meta').value);
  const prazo = parseInt(document.getElementById('des-prazo').value);
  const unidade = document.getElementById('des-unidade').value;
  if (!nome || !meta || !prazo) { toast('Preencha todos os campos', 'err'); return; }
  const div = dividas.find(d => d.id === divId);
  const dias = unidade === 'dias' ? prazo : unidade === 'semanas' ? prazo * 7 : prazo * 30;
  const vence = new Date(Date.now() + dias * 86400000).toISOString().split('T')[0];
  try {
    await addDoc(collection(db, 'users', currentUser.uid, 'desafios'), {
      nome, divId, divNome: div?.nome || '', meta, prazo, unidade, vence,
      pago: 0, concluido: false, criadoEm: Date.now(), inicio: today()
    });
    clearForm('desafio');
    await loadDesafios();
    renderDesafios();
    toast('🎯 Desafio criado!');
  } catch (e) { toast('Erro: ' + e.message, 'err'); }
};

window.atualizarDesafio = async (docId, valorPago) => {
  const des = desafios.find(d => d._docId === docId);
  if (!des) return;
  const novoPago = (des.pago || 0) + valorPago;
  const concluido = novoPago >= des.meta;
  await updateDoc(doc(db, 'users', currentUser.uid, 'desafios', docId), { pago: novoPago, concluido });
  await loadDesafios();
  renderDesafios();
  if (concluido) toast('🏆 Desafio concluído! Parabéns!');
  else toast(`✓ ${fmt(valorPago)} adicionado ao desafio.`);
};

window.excluirDesafio = async (docId) => {
  await deleteDoc(doc(db, 'users', currentUser.uid, 'desafios', docId));
  await loadDesafios();
  renderDesafios();
  toast('Desafio removido.');
};

// =============================================
//  EXPORTAR
// =============================================
window.exportJSON = () => {
  const data = { transacoes, dividas, metasProg, desafios, exportadoEm: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `financeiro-${today()}.json`;
  a.click();
  toast('JSON exportado!');
};

window.exportExcel = () => {
  // CSV que Excel abre
  const rows = [['Data', 'Tipo', 'Categoria/Dívida', 'Valor', 'Descrição']];
  transacoes.forEach(t => {
    rows.push([fmtD(t.data), t.tipo, t.label || t.divida || '', t.val?.toFixed(2) || '', t.desc || t.obs || '']);
  });
  const csv = '\uFEFF' + rows.map(r => r.map(c => `"${c}"`).join(';')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `financeiro-${today()}.csv`;
  a.click();
  toast('Excel exportado!');
};

// =============================================
//  RELATÓRIOS
// =============================================
window.setRelPeriodo = (p) => {
  const now = new Date();
  let ini, fim;
  if (p === 'mes') {
    ini = new Date(now.getFullYear(), now.getMonth(), 1);
    fim = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  } else if (p === 'anterior') {
    ini = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    fim = new Date(now.getFullYear(), now.getMonth(), 0);
  } else if (p === 'trimestre') {
    ini = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    fim = now;
  } else {
    ini = new Date(now.getFullYear(), 0, 1);
    fim = now;
  }
  document.getElementById('rel-inicio').value = ini.toISOString().split('T')[0];
  document.getElementById('rel-fim').value = fim.toISOString().split('T')[0];
};

window.gerarRelatorio = () => {
  const ini = document.getElementById('rel-inicio').value;
  const fim = document.getElementById('rel-fim').value;
  if (!ini || !fim) { toast('Selecione o período', 'err'); return; }
  const filtradas = transacoes.filter(t => t.data >= ini && t.data <= fim);
  const entradas = filtradas.filter(t => t.tipo === 'entrada').reduce((a, t) => a + t.val, 0);
  const saidas = filtradas.filter(t => t.tipo === 'saida').reduce((a, t) => a + t.val, 0);
  const pagos = filtradas.filter(t => t.tipo === 'pag-divida').reduce((a, t) => a + t.val, 0);
  const reservaAdd = filtradas.filter(t => t.tipo === 'reserva').reduce((a, t) => a + t.val, 0);
  const negociacoes = filtradas.filter(t => t.tipo === 'negociacao').length;

  document.getElementById('rel-summary').innerHTML = `
    <div class="rel-item"><div class="rel-item-label">Entradas</div><div class="rel-item-val g">${fmt(entradas)}</div></div>
    <div class="rel-item"><div class="rel-item-label">Saídas</div><div class="rel-item-val r">${fmt(saidas)}</div></div>
    <div class="rel-item"><div class="rel-item-label">Saldo</div><div class="rel-item-val ${entradas - saidas >= 0 ? 'g' : 'r'}">${fmt(entradas - saidas)}</div></div>
    <div class="rel-item"><div class="rel-item-label">Pago em dívidas</div><div class="rel-item-val a">${fmt(pagos)}</div></div>
    <div class="rel-item"><div class="rel-item-label">Reserva adicionada</div><div class="rel-item-val p">${fmt(reservaAdd)}</div></div>
    <div class="rel-item"><div class="rel-item-label">Negociações</div><div class="rel-item-val b">${negociacoes}</div></div>
  `;
  document.getElementById('rel-feed').innerHTML = filtradas.length
    ? filtradas.map(t => renderFeedItem(t, false)).join('')
    : '<div class="feed-empty">Nenhuma transação no período.</div>';
  document.getElementById('rel-resultado').style.display = 'block';
};

// =============================================
//  RENDER DASHBOARD
// =============================================
function renderDash() {
  const mes = new Date().toISOString().slice(0, 7);
  const entMes = transacoes.filter(t => t.tipo === 'entrada' && t.data?.startsWith(mes));
  const saiMes = transacoes.filter(t => t.tipo === 'saida' && t.data?.startsWith(mes));
  const totalE = entMes.reduce((a, t) => a + t.val, 0);
  const totalS = saiMes.reduce((a, t) => a + t.val, 0);
  const saldo = totalE - totalS;

  const divFora = dividas.filter(d => d.tipo === 'fora' && !d.quitada).reduce((a, d) => a + d.total, 0);
  const divPP = dividas.filter(d => d.tipo === 'picpay').reduce((a, d) => a + d.total, 0);
  const totalDiv = divFora + divPP;
  const origTotal = DIVIDAS_INIT.reduce((a, d) => a + d.orig, 0);
  const quitadas = dividas.filter(d => d.quitada).length;
  const progPct = Math.min(100, Math.round(((origTotal - totalDiv) / origTotal) * 100));
  const reserva = metasProg.reserva || 0;
  const resPct = Math.min(100, Math.round((reserva / 10000) * 100));

  const s = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  s('d-saldo', fmt(saldo));
  s('d-ent', fmt(totalE));
  s('d-sai', fmt(totalS));
  s('d-divtot', fmt(totalDiv));
  s('d-quit', quitadas + ' de ' + dividas.length);
  s('d-reserva', fmt(reserva));
  s('d-prog-pct', progPct + '%');
  s('d-prog-info', `Restam ${fmt(totalDiv)} de ${fmt(origTotal)}`);
  s('d-res-pct', resPct + '%');
  s('d-res-info', `${fmt(reserva)} de R$ 10.000`);

  const saldoEl = document.getElementById('d-saldo');
  if (saldoEl) saldoEl.className = 'metric-val ' + (saldo >= 0 ? 'g' : 'r');

  const bar = document.getElementById('d-prog-bar');
  if (bar) bar.style.width = progPct + '%';
  const resBar = document.getElementById('d-res-bar');
  if (resBar) resBar.style.width = resPct + '%';

  // Alert vencimentos
  const urgentes = dividas.filter(d => !d.quitada && d.urg === 'red');
  const alertEl = document.getElementById('dash-alert');
  if (alertEl && urgentes.length > 0) {
    alertEl.style.display = 'block';
    alertEl.textContent = `⚠ ${urgentes.length} dívida(s) com vencimento crítico. Acesse Dívidas para negociar.`;
  }

  // Feed
  const feedEl = document.getElementById('dash-feed');
  if (feedEl) {
    const recent = transacoes.slice(0, 6);
    feedEl.innerHTML = recent.length
      ? recent.map(t => renderFeedItem(t, false)).join('')
      : '<div class="feed-empty">Nenhuma movimentação registrada ainda.</div>';
  }
}

// =============================================
//  RENDER DÍVIDAS
// =============================================
function renderDividas() {
  const ativas = dividas.filter(d => d.tipo === 'fora' && !d.quitada);
  const quitadasList = dividas.filter(d => d.tipo === 'fora' && d.quitada);
  const picpayList = dividas.filter(d => d.tipo === 'picpay');

  const totalFora = ativas.reduce((a, d) => a + d.total, 0);
  const totalPP = picpayList.reduce((a, d) => a + d.total, 0);
  const totalGeral = totalFora + totalPP;

  const s = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  s('dv-total-geral', fmt(totalGeral));
  s('dv-total-fora', fmt(totalFora));

  const origFora = DIVIDAS_INIT.filter(d => d.tipo === 'fora').reduce((a, d) => a + d.orig, 0);
  const origPP = DIVIDAS_INIT.filter(d => d.tipo === 'picpay').reduce((a, d) => a + d.orig, 0);
  const origTotal = origFora + origPP;
  const pct = Math.min(100, Math.round(((origTotal - totalGeral) / origTotal) * 100));
  const bar = document.getElementById('dv-bar');
  if (bar) bar.style.width = pct + '%';

  // Ativas
  const ativasEl = document.getElementById('dv-ativas');
  if (ativasEl) ativasEl.innerHTML = ativas.length
    ? ativas.map(d => renderDivCard(d)).join('')
    : '<div class="empty-state"><div class="empty-state-icon">🎉</div><div class="empty-state-text">Nenhuma dívida ativa fora da folha!</div></div>';

  // PicPay
  const ppEl = document.getElementById('dv-picpay');
  if (ppEl) ppEl.innerHTML = picpayList.map(d => renderDivCard(d)).join('');

  // Quitadas
  const quitEl = document.getElementById('dv-quitadas');
  if (quitEl) quitEl.innerHTML = quitadasList.length
    ? quitadasList.map(d => renderDivCard(d)).join('')
    : '<div class="empty-state"><div class="empty-state-icon">⏳</div><div class="empty-state-text">Nenhuma dívida quitada ainda. Em breve!</div></div>';
}

function renderDivCard(d) {
  const bc = d.urg === 'red' ? 'b-red' : d.urg === 'amber' ? 'b-amber' : d.urg === 'green' ? 'b-green' : d.urg === 'blue' ? 'b-blue' : 'b-gray';
  const ul = d.urg === 'red' ? 'Crítico' : d.urg === 'amber' ? 'Urgente' : d.urg === 'green' ? 'Moderado' : d.urg === 'blue' ? 'Mensal' : 'Folha';
  const pago = d.pago || 0;
  const progPct = d.orig > 0 ? Math.min(100, Math.round((pago / d.orig) * 100)) : 0;
  const negTag = d.negociada ? `<span class="badge b-blue" style="margin-left:6px">Negociada</span>` : '';
  const novaInfo = d.negociada && d.novaParcela ? `<div style="font-size:12px;color:var(--blue);margin-top:3px">Nova parcela: ${fmt(d.novaParcela)} × ${d.novaQtd}x = ${fmt(d.total)}${d.economia > 0 ? ' (economia: ' + fmt(d.economia) + ')' : ''}</div>` : '';
  const ppInfo = d.tipo === 'picpay' ? `<div style="font-size:12px;color:var(--muted);margin-top:2px">Parcela mensal: ${fmt(d.parcela)} | ${d.parcelas} parcelas originais</div>` : '';

  if (d.quitada) return `
    <div class="div-card quitada">
      <div class="div-header">
        <div><div class="div-nome">${d.nome} <span class="badge b-green">✓ Quitada</span></div>
        <div class="div-meta">Quitada em ${fmtD(d.dataQuit)} · Original: ${fmt(d.orig)}</div></div>
        <button class="btn btn-g btn-sm" onclick="reativarDivida('${d.id}')">Desfazer</button>
      </div>
    </div>`;

  return `
    <div class="div-card${d.negociada ? ' negociada' : ''}${d.tipo === 'picpay' ? ' picpay' : ''}">
      <div class="div-header">
        <div style="flex:1">
          <div class="div-nome">${d.nome} <span class="badge ${bc}">${ul}</span>${negTag}</div>
          <div class="div-meta">Vence: ${d.vence} · Original: ${fmt(d.orig)} · <strong style="color:var(--red)">Restante: ${fmt(d.total)}</strong></div>
          ${novaInfo}${ppInfo}
          ${pago > 0 ? `<div style="font-size:12px;color:var(--accent);margin-top:2px">Pago: ${fmt(pago)}</div>` : ''}
        </div>
        <div class="div-actions">
          <button class="btn btn-g btn-sm" onclick="goPage('controle');switchTab('ctrl','t-negoc');document.getElementById('n-div').value='${d.id}'">Negociar</button>
          <button class="btn btn-g btn-sm" onclick="goPage('controle');switchTab('ctrl','t-pagdiv');document.getElementById('pd-div').value='${d.id}'">Pagar</button>
          <button class="btn btn-p btn-sm" onclick="quitarDivida('${d.id}')">Quitar ✓</button>
        </div>
      </div>
      ${pago > 0 ? `
        <div class="div-prog-label"><span>Progresso</span><span>${progPct}%</span></div>
        <div class="prog-wrap"><div class="prog-bar" style="width:${progPct}%;background:var(--accent)"></div></div>
      ` : ''}
    </div>`;
}

// =============================================
//  RENDER METAS
// =============================================
function renderMetas() {
  const el = document.getElementById('metas-lista');
  if (!el) return;

  const divFora = dividas.filter(d => d.tipo === 'fora' && !d.quitada).reduce((a, d) => a + d.total, 0);
  const divPP = dividas.filter(d => d.tipo === 'picpay').reduce((a, d) => a + d.total, 0);
  const totalOrigDiv = DIVIDAS_INIT.reduce((a, d) => a + d.orig, 0);
  const divPago = totalOrigDiv - divFora - divPP;

  el.innerHTML = METAS_DEF.map(m => {
    let atual = 0;
    if (m.id === 'dividas') atual = Math.max(0, divPago);
    else if (m.id === 'reserva') atual = metasProg.reserva || 0;
    else if (m.id === 'meta50k') atual = metasProg.meta50k || 0;
    else atual = metasProg.meta100k || 0;
    const pct = Math.min(100, Math.round((atual / m.alvo) * 100));
    const cor = m.cor === 'red' ? 'var(--red)' : m.cor === 'purple' ? 'var(--purple)' : m.cor === 'blue' ? 'var(--blue)' : 'var(--accent)';
    const concluida = pct >= 100;
    return `
      <div class="meta-card" style="border-left:3px solid ${cor}${concluida ? ';opacity:.8' : ''}">
        <div class="meta-header">
          <div>
            <div class="meta-nome" style="color:${cor}">${concluida ? '✓ ' : ''}${m.nome}</div>
            <div style="font-size:12px;color:var(--muted);margin-top:3px">${m.desc}</div>
          </div>
          <div style="text-align:right;flex-shrink:0">
            <div class="meta-pct" style="color:${cor}">${pct}%</div>
            <div style="font-size:11px;color:var(--muted)">concluído</div>
          </div>
        </div>
        <div class="prog-wrap" style="margin-bottom:.75rem">
          <div class="prog-bar" style="width:${pct}%;background:${cor}"></div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--muted);margin-bottom:.75rem">
          <span>Acumulado: <strong style="color:${cor}">${fmt(atual)}</strong></span>
          <span>Meta: <strong>${fmt(m.alvo)}</strong></span>
          <span>Faltam: <strong style="color:var(--red)">${fmt(Math.max(0, m.alvo - atual))}</strong></span>
        </div>
        ${m.id !== 'dividas' ? `<button class="btn btn-g btn-sm" onclick="addMetaProg('${m.id}')" style="margin-bottom:.75rem">+ Registrar valor</button>` : ''}
        <div class="meta-grid">
          <div class="meta-info-item">
            <div class="meta-info-label">O que fazer</div>
            ${m.acoes.map(a => `<div style="font-size:12px;margin-top:4px;color:var(--text)">• ${a}</div>`).join('')}
          </div>
          <div class="meta-info-item">
            <div class="meta-info-label">O que evitar</div>
            ${m.evitar.map(a => `<div style="font-size:12px;margin-top:4px;color:var(--red)">✗ ${a}</div>`).join('')}
          </div>
        </div>
      </div>`;
  }).join('');
}

window.addMetaProg = async (id) => {
  const val = parseFloat(prompt(`Quanto adicionar à meta? (R$)`));
  if (!val || val <= 0) return;
  metasProg[id] = (metasProg[id] || 0) + val;
  await setDoc(doc(db, 'users', currentUser.uid, 'config', 'metas'), metasProg);
  await addDoc(collection(db, 'users', currentUser.uid, 'transacoes'), {
    tipo: 'meta', label: 'Investimento — ' + id, val, data: today(), criadoEm: Date.now()
  });
  renderMetas();
  toast(`✓ ${fmt(val)} adicionado à meta!`);
};

// =============================================
//  RENDER DESAFIOS
// =============================================
function renderDesafios() {
  const el = document.getElementById('desafios-lista');
  if (!el) return;
  if (!desafios.length) {
    el.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🎯</div><div class="empty-state-text">Nenhum desafio criado ainda. Crie um acima!</div></div>';
    return;
  }
  el.innerHTML = desafios.map(d => {
    const pct = Math.min(100, Math.round(((d.pago || 0) / d.meta) * 100));
    const diasRestantes = Math.max(0, Math.ceil((new Date(d.vence) - new Date()) / 86400000));
    return `
      <div class="desafio-card${d.concluido ? ' concluido' : ''}">
        <div class="desafio-header">
          <div>
            <div class="desafio-nome">${d.nome} ${d.concluido ? '🏆' : ''}</div>
            <div style="font-size:12px;color:var(--muted);margin-top:2px">${d.divNome} · Prazo: ${d.prazo} ${d.unidade} · Vence: ${fmtD(d.vence)}</div>
          </div>
          <div style="text-align:right">
            <div class="desafio-dias">${diasRestantes}</div>
            <div style="font-size:11px;color:var(--muted)">dias restantes</div>
          </div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--muted);margin-bottom:5px">
          <span>Pago: ${fmt(d.pago || 0)}</span><span>Meta: ${fmt(d.meta)}</span><span>${pct}%</span>
        </div>
        <div class="prog-wrap" style="margin-bottom:.75rem">
          <div class="prog-bar" style="width:${pct}%;background:var(--amber)"></div>
        </div>
        ${!d.concluido ? `
          <div style="display:flex;gap:6px;align-items:center">
            <input class="fi" type="number" placeholder="Valor pago" id="des-pag-${d._docId}" style="max-width:150px;margin:0" step="0.01" min="0">
            <button class="btn btn-p btn-sm" onclick="atualizarDesafio('${d._docId}',parseFloat(document.getElementById('des-pag-${d._docId}').value)||0)">+ Registrar</button>
            <button class="btn btn-d btn-sm" onclick="excluirDesafio('${d._docId}')">Excluir</button>
          </div>` : `<span class="badge b-green">✓ Concluído em ${fmtD(d.vence)}</span>`}
      </div>`;
  }).join('');
}

// =============================================
//  RENDER HISTÓRICO
// =============================================
window.filtHist = (filtro, btn) => {
  histFiltro = filtro;
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  btn?.classList.add('active');
  renderHist(filtro);
};

function renderHist(filtro) {
  const el = document.getElementById('hist-feed');
  if (!el) return;
  let items = filtro === 'todos' ? transacoes : transacoes.filter(t => t.tipo === filtro);
  if (!items.length) { el.innerHTML = '<div class="feed-empty">Nenhum registro encontrado.</div>'; return; }
  el.innerHTML = items.map(t => renderFeedItem(t, true)).join('');
}

function renderFeedItem(t, showDelete = false) {
  const isPos = ['entrada', 'reserva', 'meta'].includes(t.tipo);
  const isNeg = ['saida', 'pag-divida'].includes(t.tipo);
  const valHtml = isPos ? `<div class="feed-val pos">+${fmt(t.val)}</div>`
    : isNeg ? `<div class="feed-val neg">-${fmt(t.val)}</div>`
    : t.val ? `<div class="feed-val a">${fmt(t.val)}</div>` : '';
  const desc = t.tipo === 'negociacao'
    ? `${t.divida} — ${t.resLabel}${t.parc ? ' · ' + fmt(t.parc) + ' × ' + t.qtd + 'x' : ''}`
    : t.label || t.divida || '';
  const obs = (t.desc || t.obs) ? ` <span style="color:var(--muted)">· ${t.desc || t.obs}</span>` : '';
  const del = showDelete ? `<button class="btn btn-g btn-sm" onclick="excluirTx('${t._docId}')" style="padding:2px 7px;margin-left:4px">×</button>` : '';
  return `
    <div class="feed-item ${t.tipo}">
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:500;word-break:break-word">${desc}${obs}</div>
        <div class="feed-meta">${fmtD(t.data)} · ${t.tipo}</div>
      </div>
      <div style="display:flex;align-items:center;gap:4px;flex-shrink:0">${valHtml}${del}</div>
    </div>`;
}

window.excluirTx = async (docId) => {
  await deleteDoc(doc(db, 'users', currentUser.uid, 'transacoes', docId));
  toast('Registro removido.');
};

// =============================================
//  MODALS
// =============================================
window.closeModal = () => {
  document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
};

window.confirmarLimpar = () => {
  document.getElementById('modal-msg').textContent = 'Isso apagará TODAS as transações registradas. As dívidas voltam ao estado inicial. Essa ação não pode ser desfeita.';
  document.getElementById('modal-confirm-btn').onclick = limparTudo;
  document.getElementById('modal-confirm').classList.add('open');
};

async function limparTudo() {
  closeModal();
  const snap = await getDocs(collection(db, 'users', currentUser.uid, 'transacoes'));
  for (const d of snap.docs) await deleteDoc(d.ref);
  for (const div of DIVIDAS_INIT) {
    await setDoc(doc(db, 'users', currentUser.uid, 'dividas', div.id), div);
  }
  await setDoc(doc(db, 'users', currentUser.uid, 'config', 'metas'), { reserva: 0, meta50k: 0, meta100k: 0 });
  metasProg = { reserva: 0, meta50k: 0, meta100k: 0 };
  toast('Dados limpos.');
}

// =============================================
//  CLEAR FORMS
// =============================================
window.clearForm = (form) => {
  const maps = {
    entrada: [['e-val', ''], ['e-desc', '']],
    saida: [['s-val', ''], ['s-desc', '']],
    negoc: [['n-parc', ''], ['n-qtd', ''], ['n-obs', '']],
    pagdiv: [['pd-val', ''], ['pd-obs', '']],
    reserva: [['rv-val', ''], ['rv-obs', '']],
    desafio: [['des-nome', ''], ['des-meta', ''], ['des-prazo', '']],
  };
  (maps[form] || []).forEach(([id, val]) => {
    const el = document.getElementById(id); if (el) el.value = val;
  });
};
