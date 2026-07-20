// =============================================
//  SISTEMA FINANCEIRO — VINÍCIUS
//  app.js
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
  { id: 'outros-b',    nome: 'Outros B',       total: 3240.00,  orig: 3240.00,  pago: 0, parcMensal: 540.00,  parcsTotal: 6,  parcsPagas: 0, venceDia: 20, urg: 'red',   tipo: 'fora' },
  { id: 'recarga-pay', nome: 'Recarga Pay',     total: 1070.75,  orig: 1070.75,  pago: 0, parcMensal: 535.25,  parcsTotal: 2,  parcsPagas: 0, venceDia: 22, urg: 'red',   tipo: 'fora' },
  { id: 'mp-a',        nome: 'Mercado Pago A',  total: 2068.57,  orig: 2068.57,  pago: 0, parcMensal: 295.51,  parcsTotal: 7,  parcsPagas: 0, venceDia: 29, urg: 'red',   tipo: 'fora' },
  { id: 'mp-c',        nome: 'Mercado Pago C',  total: 448.56,   orig: 448.56,   pago: 0, parcMensal: 448.56,  parcsTotal: 1,  parcsPagas: 0, venceDia: 6,  urg: 'red',   tipo: 'fora' },
  { id: 'mp-d',        nome: 'Mercado Pago D',  total: 966.90,   orig: 966.90,   pago: 0, parcMensal: 161.15,  parcsTotal: 6,  parcsPagas: 0, venceDia: 10, urg: 'amber', tipo: 'fora' },
  { id: 'outros-c',    nome: 'Outros C',        total: 300.00,   orig: 300.00,   pago: 0, parcMensal: 300.00,  parcsTotal: 1,  parcsPagas: 0, venceDia: 10, urg: 'amber', tipo: 'fora' },
  { id: 'outros-d',    nome: 'Outros D',        total: 375.00,   orig: 375.00,   pago: 0, parcMensal: 375.00,  parcsTotal: 1,  parcsPagas: 0, venceDia: 10, urg: 'amber', tipo: 'fora' },
  { id: 'mp-b',        nome: 'Mercado Pago B',  total: 713.10,   orig: 713.10,   pago: 0, parcMensal: 118.85,  parcsTotal: 6,  parcsPagas: 0, venceDia: 17, urg: 'amber', tipo: 'fora' },
  { id: 'outros-efg',  nome: 'Outros E/F/G',    total: 3600.00,  orig: 3600.00,  pago: 0, parcMensal: 300.00,  parcsTotal: 15, parcsPagas: 0, venceDia: 10, urg: 'green', tipo: 'fora' },
  { id: 'outros-a',    nome: 'Outros A (mae)',   total: 13269.90, orig: 13269.90, pago: 0, parcMensal: 221.17,  parcsTotal: 60, parcsPagas: 0, venceDia: 10, urg: 'blue',  tipo: 'fora' },
  { id: 'pp-a', nome: 'PicPay A', total: 17356.50, orig: 17356.50, pago: 0, parcMensal: 385.70, parcsTotal: 45, parcsPagas: 0, venceDia: 5, urg: 'gray', tipo: 'picpay' },
  { id: 'pp-b', nome: 'PicPay B', total: 10166.85, orig: 10166.85, pago: 0, parcMensal: 199.35, parcsTotal: 51, parcsPagas: 0, venceDia: 5, urg: 'gray', tipo: 'picpay' },
  { id: 'pp-c', nome: 'PicPay C', total: 7509.84,  orig: 7509.84,  pago: 0, parcMensal: 192.56, parcsTotal: 39, parcsPagas: 0, venceDia: 5, urg: 'gray', tipo: 'picpay' },
];

const CATS_INIT = {
  entrada: ['Salario CLT','Adiantamento (dia 20)','Vale Alimentacao','Petshop R$200','Petshop R$300','Renda Extra IA','Renda Extra Afiliado','Renda Extra Comissao','13 Salario','Ferias','Outros'],
  saida:   ['Fatura cartao','Gastos de casa','Alimentacao','Transporte','Saude / Dentista','Academia','Barbearia','Celular','Internet','Apostas','Lazer','Outros']
};

const METAS_DEF = [
  { id: 'dividas',  nome: 'Quitar todas as dividas',       alvo: 61085.97, cor: 'red',
    acoes:  ['Negociar dividas de julho imediatamente','Usar sobra extra 100% nas dividas','Nunca contrair novo emprestimo em fintech'],
    evitar: ['Apostas','Parcelar coisas novas no cartao','Ignorar cobrancas'],
    desc:   'Eliminar os R$ 26.052 fora da folha + PicPay. A fundacao de tudo.' },
  { id: 'reserva', nome: 'Reserva de emergencia R$ 10.000', alvo: 10000,    cor: 'purple',
    acoes:  ['Guardar R$ 200/mes nas semanas de R$300 no petshop','Todo 13 vai direto para reserva'],
    evitar: ['Usar reserva para consumo','Deixar parado na poupanca'],
    desc:   'Seu escudo. Sem ela, qualquer imprevisto vira nova divida.' },
  { id: 'meta50k', nome: 'Juntar R$ 50.000',               alvo: 50000,    cor: 'blue',
    acoes:  ['Manter negocio de IA gerando R$ 2.000+/mes','Investir em FIIs','Reinvestir 100% dos rendimentos'],
    evitar: ['Inflacionar padrao de vida','Risco antes de ter base'],
    desc:   'Com dividas zeradas e renda extra, acumular em 2-3 anos.' },
  { id: 'meta100k',nome: 'Juntar R$ 100.000',              alvo: 100000,   cor: 'accent',
    acoes:  ['FIIs: renda passiva de R$ 700-900/mes','Carteira: 60% renda fixa + 40% variavel'],
    evitar: ['Concentrar em unico ativo','Resgatar para consumo antes da meta'],
    desc:   'O ponto de virada. FIIs gerando R$ 700-900/mes passivos.' },
];

// =============================================
//  ESTADO
// =============================================
let currentUser = null;
let dividas = [];
let transacoes = [];
let cats = { entrada: [], saida: [] };
let desafios = [];
let metasProg = {};
let histFiltro = 'todos';

// =============================================
//  UTILS
// =============================================
const fmt = v => 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const today = () => new Date().toISOString().split('T')[0];
const fmtD = d => {
  if (!d) return '-';
  if (d.includes('-')) { const p = d.split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }
  return d;
};
function toast(msg, type) {
  type = type || 'ok';
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'show ' + type;
  setTimeout(function() { t.className = ''; }, 3500);
}
function setLoading(show) {
  document.getElementById('loading').style.display = show ? 'flex' : 'none';
}
function uid() { return currentUser ? currentUser.uid : null; }
function uref(path) { return doc(db, 'users', uid(), path); }
function ucol(path) { return collection(db, 'users', uid(), path); }

// =============================================
//  AUTH
// =============================================
window.loginGoogle = async function() {
  try {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  } catch (e) { toast('Erro ao fazer login: ' + e.message, 'err'); }
};

window.logout = async function() { await signOut(auth); };

onAuthStateChanged(auth, async function(user) {
  setLoading(true);
  if (user) {
    currentUser = user;
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    const av = document.getElementById('nav-avatar');
    if (av) av.textContent = user.displayName ? user.displayName.charAt(0).toUpperCase() : 'V';
    const cfgUser = document.getElementById('cfg-user-info');
    if (cfgUser) cfgUser.textContent = 'Logado como: ' + user.displayName + ' (' + user.email + ')';
    await initUser();
  } else {
    currentUser = null;
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('app').style.display = 'none';
  }
  setLoading(false);
});

// =============================================
//  INIT
// =============================================
async function initUser() {
  const cfgDoc = await getDoc(uref('config/prefs'));
  if (cfgDoc.exists() && cfgDoc.data().theme) setTheme(cfgDoc.data().theme, false);

  const divSnap = await getDocs(ucol('dividas'));
  if (divSnap.empty) {
    for (const d of DIVIDAS_INIT) await setDoc(doc(db, 'users', uid(), 'dividas', d.id), d);
  }

  const catsDoc = await getDoc(uref('config/categorias'));
  if (!catsDoc.exists()) await setDoc(uref('config/categorias'), CATS_INIT);

  const metasDoc = await getDoc(uref('config/metas'));
  if (!metasDoc.exists()) await setDoc(uref('config/metas'), { reserva: 0, meta50k: 0, meta100k: 0 });

  await loadAll();
  listenTransacoes();
  listenDividas();
}

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
  bindCatButtons();
}

async function loadDividas() {
  const snap = await getDocs(ucol('dividas'));
  dividas = snap.docs.map(function(d) { return Object.assign({}, d.data(), { _docId: d.id }); });
}
async function loadCats() {
  const snap = await getDoc(uref('config/categorias'));
  cats = snap.exists() ? snap.data() : JSON.parse(JSON.stringify(CATS_INIT));
}
async function loadDesafios() {
  const snap = await getDocs(query(ucol('desafios'), orderBy('criadoEm', 'desc')));
  desafios = snap.docs.map(function(d) { return Object.assign({}, d.data(), { _docId: d.id }); });
}
async function loadMetas() {
  const snap = await getDoc(uref('config/metas'));
  metasProg = snap.exists() ? snap.data() : { reserva: 0, meta50k: 0, meta100k: 0 };
}

// =============================================
//  LISTENERS
// =============================================
function listenTransacoes() {
  onSnapshot(query(ucol('transacoes'), orderBy('criadoEm', 'desc')), function(snap) {
    transacoes = snap.docs.map(function(d) { return Object.assign({}, d.data(), { _docId: d.id }); });
    renderDash();
    renderHist(histFiltro);
  });
}
function listenDividas() {
  onSnapshot(ucol('dividas'), function(snap) {
    dividas = snap.docs.map(function(d) { return Object.assign({}, d.data(), { _docId: d.id }); });
    renderDividas();
    renderDash();
    renderMetas();
    renderDivSelect();
  });
}

// =============================================
//  NAVIGATION
// =============================================
window.goPage = function(id) {
  document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
  document.querySelectorAll('.nav-btn').forEach(function(b, i) {
    var ids = ['dashboard','controle','dividas','metas','desafios','relatorios','config'];
    b.classList.toggle('active', ids[i] === id);
  });
  var pg = document.getElementById('page-' + id);
  if (pg) pg.classList.add('active');
  window.scrollTo(0, 0);
};

// =============================================
//  TABS
// =============================================
window.switchTab = function(group, id) {
  var panel = document.getElementById(id);
  if (!panel) return;
  var parent = panel.closest('.container') || panel.parentElement;
  parent.querySelectorAll('.tab-panel').forEach(function(p) { p.classList.remove('active'); });
  parent.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); });
  panel.classList.add('active');
  var allPanels = Array.from(parent.querySelectorAll('.tab-panel'));
  var allTabs = Array.from(parent.querySelectorAll('.tab'));
  allPanels.forEach(function(p, i) { if (p === panel && allTabs[i]) allTabs[i].classList.add('active'); });
  if (id === 't-hist') renderHist(histFiltro);
  if (id === 't-cats') { renderCats(); bindCatButtons(); }
  if (id === 'dv-parcelas') renderParcelas();
};

// =============================================
//  THEME
// =============================================
window.setTheme = function(theme, save) {
  if (save === undefined) save = true;
  document.documentElement.setAttribute('data-theme', theme);
  document.querySelectorAll('.theme-btn').forEach(function(b, i) {
    b.classList.toggle('active', ['dark','clean','corporate'][i] === theme);
  });
  if (save && currentUser) setDoc(uref('config/prefs'), { theme: theme });
};

// =============================================
//  FORMS
// =============================================
function initForms() {
  ['e-data','s-data','n-data','pd-data','rv-data'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.value = today();
  });
  var h = new Date().getHours();
  var gr = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  var el = document.getElementById('dash-greeting');
  if (el) el.textContent = gr + ', Vinicius!';
}

function renderCatSelects() {
  var ecat = document.getElementById('e-cat');
  var scat = document.getElementById('s-cat');
  if (ecat) ecat.innerHTML = (cats.entrada || []).map(function(c) { return '<option value="' + c + '">' + c + '</option>'; }).join('');
  if (scat) scat.innerHTML = (cats.saida || []).map(function(c) { return '<option value="' + c + '">' + c + '</option>'; }).join('');
}

function renderDivSelect() {
  var divs = dividas.filter(function(d) { return !d.quitada; });
  var html = divs.map(function(d) { return '<option value="' + d.id + '">' + d.nome + ' - ' + fmt(d.total) + '</option>'; }).join('');
  ['n-div','pd-div','des-div'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.innerHTML = html;
  });
}

function bindCatButtons() {
  var btnE = document.getElementById('btn-add-entrada');
  var btnS = document.getElementById('btn-add-saida');
  if (btnE) btnE.onclick = function() { addCat('entrada'); };
  if (btnS) btnS.onclick = function() { addCat('saida'); };
  var inpE = document.getElementById('new-cat-entrada');
  var inpS = document.getElementById('new-cat-saida');
  if (inpE) inpE.onkeydown = function(e) { if (e.key === 'Enter') addCat('entrada'); };
  if (inpS) inpS.onkeydown = function(e) { if (e.key === 'Enter') addCat('saida'); };
}

// =============================================
//  REGISTROS
// =============================================
window.regEntrada = async function() {
  var cat = document.getElementById('e-cat').value;
  var val = parseFloat(document.getElementById('e-val').value);
  var data = document.getElementById('e-data').value || today();
  var desc = document.getElementById('e-desc').value;
  if (!val || val <= 0) { toast('Informe um valor valido', 'err'); return; }
  await addDoc(ucol('transacoes'), { tipo: 'entrada', cat: cat, label: cat, val: val, data: data, desc: desc, criadoEm: Date.now() });
  clearForm('entrada');
  toast('Entrada registrada!');
};

window.regSaida = async function() {
  var cat = document.getElementById('s-cat').value;
  var val = parseFloat(document.getElementById('s-val').value);
  var data = document.getElementById('s-data').value || today();
  var desc = document.getElementById('s-desc').value;
  if (!val || val <= 0) { toast('Informe um valor valido', 'err'); return; }
  if (cat.includes('Apostas')) toast('Aposta registrada. Cada R$ apostado atrasa sua liberdade.', 'warn');
  await addDoc(ucol('transacoes'), { tipo: 'saida', cat: cat, label: cat, val: val, data: data, desc: desc, criadoEm: Date.now() });
  clearForm('saida');
  if (!cat.includes('Apostas')) toast('Saida registrada.');
};

window.regNegoc = async function() {
  var divId = document.getElementById('n-div').value;
  var res = document.getElementById('n-res').value;
  var parc = parseFloat(document.getElementById('n-parc').value) || 0;
  var qtd = parseInt(document.getElementById('n-qtd').value) || 0;
  var obs = document.getElementById('n-obs').value;
  var data = document.getElementById('n-data').value || today();
  var div = dividas.find(function(d) { return d.id === divId; });
  if (!div) return;
  var resLabels = { parcelada: 'Renegociada em parcelas', desconto: 'Desconto obtido', prazo: 'Prazo estendido', recusada: 'Credor recusou', aguardando: 'Aguardando' };
  if (res !== 'recusada' && res !== 'aguardando' && parc > 0 && qtd > 0) {
    var novoTotal = parc * qtd;
    var economia = div.total - novoTotal;
    await updateDoc(doc(db, 'users', uid(), 'dividas', divId), { total: novoTotal, negociada: true, novaParcela: parc, novaQtd: qtd, parcMensal: parc, parcsTotal: qtd, economia: Math.max(0, economia) });
    toast('Divida renegociada! Novo total: ' + fmt(novoTotal));
  } else {
    await updateDoc(doc(db, 'users', uid(), 'dividas', divId), { negociada: true });
    toast('Negociacao registrada.');
  }
  await addDoc(ucol('transacoes'), { tipo: 'negociacao', divida: div.nome, resultado: res, resLabel: resLabels[res] || res, parc: parc, qtd: qtd, obs: obs, data: data, criadoEm: Date.now() });
  clearForm('negoc');
};

window.regPagDiv = async function() {
  var divId = document.getElementById('pd-div').value;
  var valInput = parseFloat(document.getElementById('pd-val').value) || 0;
  var tipoEl = document.getElementById('pd-tipo');
  var tipoPag = tipoEl ? tipoEl.value : 'parcela';
  var data = document.getElementById('pd-data').value || today();
  var obs = document.getElementById('pd-obs').value;
  var div = dividas.find(function(d) { return d.id === divId; });
  if (!div) return;
  var val = valInput > 0 ? valInput : (div.parcMensal || 0);
  if (!val || val <= 0) { toast('Informe um valor valido', 'err'); return; }
  var novoPago = (div.pago || 0) + val;
  var novoTotal = Math.max(0, div.total - val);
  var parcsPagas = (div.parcsPagas || 0) + (tipoPag === 'parcela' ? 1 : 0);
  var updates = { pago: novoPago, total: novoTotal, parcsPagas: parcsPagas };
  if (novoTotal <= 0.01) { updates.quitada = true; updates.dataQuit = data; }
  await updateDoc(doc(db, 'users', uid(), 'dividas', divId), updates);
  await addDoc(ucol('transacoes'), { tipo: 'pag-divida', divida: div.nome, label: 'Pagamento - ' + div.nome, val: val, data: data, obs: obs, criadoEm: Date.now() });
  clearForm('pagdiv');
  if (novoTotal <= 0.01) toast('QUITADA: ' + div.nome + '!');
  else {
    var parcsRest = (div.parcsTotal || 0) - parcsPagas;
    toast(fmt(val) + ' pago em ' + div.nome + '. Restam ' + parcsRest + ' parcelas.');
  }
};

window.pagarParcela = async function(divId) {
  var div = dividas.find(function(d) { return d.id === divId; });
  if (!div) return;
  var val = div.parcMensal || 0;
  if (!val) { toast('Parcela nao definida', 'err'); return; }
  var novoPago = (div.pago || 0) + val;
  var novoTotal = Math.max(0, div.total - val);
  var parcsPagas = (div.parcsPagas || 0) + 1;
  var updates = { pago: novoPago, total: novoTotal, parcsPagas: parcsPagas };
  if (novoTotal <= 0.01) { updates.quitada = true; updates.dataQuit = today(); }
  await updateDoc(doc(db, 'users', uid(), 'dividas', divId), updates);
  await addDoc(ucol('transacoes'), { tipo: 'pag-divida', divida: div.nome, label: 'Parcela - ' + div.nome, val: val, data: today(), criadoEm: Date.now() });
  var parcsRest = (div.parcsTotal || 0) - parcsPagas;
  if (novoTotal <= 0.01) toast('QUITADA: ' + div.nome + '!');
  else toast('Parcela de ' + fmt(val) + ' paga! Restam ' + parcsRest + ' parcelas.');
};

window.quitarDivida = async function(id) {
  var div = dividas.find(function(d) { return d.id === id; });
  if (!div) return;
  await updateDoc(doc(db, 'users', uid(), 'dividas', id), { quitada: true, dataQuit: today() });
  await addDoc(ucol('transacoes'), { tipo: 'quitada', divida: div.nome, label: 'Quitada - ' + div.nome, val: div.orig, data: today(), criadoEm: Date.now() });
  toast('QUITADA: ' + div.nome + '!');
};

window.reativarDivida = async function(id) {
  await updateDoc(doc(db, 'users', uid(), 'dividas', id), { quitada: false, dataQuit: null });
  toast('Divida reativada.');
};

window.regReserva = async function() {
  var val = parseFloat(document.getElementById('rv-val').value);
  var data = document.getElementById('rv-data').value || today();
  var obs = document.getElementById('rv-obs').value;
  if (!val || val <= 0) { toast('Informe um valor valido', 'err'); return; }
  metasProg.reserva = (metasProg.reserva || 0) + val;
  await setDoc(uref('config/metas'), metasProg);
  await addDoc(ucol('transacoes'), { tipo: 'reserva', label: 'Reserva de emergencia', val: val, data: data, obs: obs, criadoEm: Date.now() });
  clearForm('reserva');
  toast('Adicionado a reserva: ' + fmt(metasProg.reserva));
  renderMetas();
};

// =============================================
//  CATEGORIAS
// =============================================
async function addCat(tipo) {
  var input = document.getElementById('new-cat-' + tipo);
  if (!input) return;
  var nome = input.value.trim();
  if (!nome) return;
  if (!cats[tipo]) cats[tipo] = [];
  cats[tipo].push(nome);
  await setDoc(uref('config/categorias'), cats);
  input.value = '';
  renderCats();
  renderCatSelects();
  bindCatButtons();
  toast('Categoria adicionada!');
}

window.editCat = function(tipo, idx) {
  document.getElementById('editcat-nome').value = cats[tipo][idx];
  document.getElementById('editcat-id').value = idx;
  document.getElementById('editcat-tipo').value = tipo;
  document.getElementById('modal-editcat').classList.add('open');
};

window.salvarEditCat = async function() {
  var nome = document.getElementById('editcat-nome').value.trim();
  var idx = parseInt(document.getElementById('editcat-id').value);
  var tipo = document.getElementById('editcat-tipo').value;
  if (!nome) return;
  cats[tipo][idx] = nome;
  await setDoc(uref('config/categorias'), cats);
  closeModal();
  renderCats();
  renderCatSelects();
  toast('Categoria atualizada!');
};

window.deleteCat = async function(tipo, idx) {
  cats[tipo].splice(idx, 1);
  await setDoc(uref('config/categorias'), cats);
  renderCats();
  renderCatSelects();
  toast('Categoria removida.');
};

function renderCats() {
  ['entrada','saida'].forEach(function(tipo) {
    var el = document.getElementById('cats-' + tipo);
    if (!el) return;
    var list = cats[tipo] || [];
    el.innerHTML = list.map(function(c, i) {
      return '<div class="cat-item"><span>' + c + '</span><div class="cat-item-actions"><button class="btn btn-g btn-sm" onclick="editCat(\'' + tipo + '\',' + i + ')">edit</button><button class="btn btn-d btn-sm" onclick="deleteCat(\'' + tipo + '\',' + i + ')">x</button></div></div>';
    }).join('');
  });
}

// =============================================
//  DESAFIOS
// =============================================
window.criarDesafio = async function() {
  var nome = document.getElementById('des-nome').value.trim();
  var divId = document.getElementById('des-div').value;
  var meta = parseFloat(document.getElementById('des-meta').value);
  var prazo = parseInt(document.getElementById('des-prazo').value);
  var unidade = document.getElementById('des-unidade').value;
  if (!nome || !meta || !prazo) { toast('Preencha todos os campos', 'err'); return; }
  var div = dividas.find(function(d) { return d.id === divId; });
  var dias = unidade === 'dias' ? prazo : unidade === 'semanas' ? prazo * 7 : prazo * 30;
  var vence = new Date(Date.now() + dias * 86400000).toISOString().split('T')[0];
  await addDoc(ucol('desafios'), { nome: nome, divId: divId, divNome: div ? div.nome : '', meta: meta, prazo: prazo, unidade: unidade, vence: vence, pago: 0, concluido: false, criadoEm: Date.now(), inicio: today() });
  clearForm('desafio');
  await loadDesafios();
  renderDesafios();
  toast('Desafio criado!');
};

window.atualizarDesafio = async function(docId, valorPago) {
  if (!valorPago || valorPago <= 0) { toast('Informe um valor', 'err'); return; }
  var des = desafios.find(function(d) { return d._docId === docId; });
  if (!des) return;
  var novoPago = (des.pago || 0) + valorPago;
  var concluido = novoPago >= des.meta;
  await updateDoc(doc(db, 'users', uid(), 'desafios', docId), { pago: novoPago, concluido: concluido });
  await loadDesafios();
  renderDesafios();
  if (concluido) toast('Desafio concluido!');
  else toast(fmt(valorPago) + ' adicionado ao desafio.');
};

window.excluirDesafio = async function(docId) {
  await deleteDoc(doc(db, 'users', uid(), 'desafios', docId));
  await loadDesafios();
  renderDesafios();
  toast('Desafio removido.');
};

// =============================================
//  EXPORTAR
// =============================================
window.exportJSON = function() {
  var data = { transacoes: transacoes, dividas: dividas, metasProg: metasProg, desafios: desafios, exportadoEm: new Date().toISOString() };
  var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'financeiro-' + today() + '.json';
  a.click();
  toast('JSON exportado!');
};

window.exportExcel = function() {
  var rows = [['Data','Tipo','Categoria/Divida','Valor','Descricao']];
  transacoes.forEach(function(t) {
    rows.push([fmtD(t.data), t.tipo, t.label || t.divida || '', (t.val || 0).toFixed(2), t.desc || t.obs || '']);
  });
  var csv = '\uFEFF' + rows.map(function(r) { return r.map(function(c) { return '"' + c + '"'; }).join(';'); }).join('\n');
  var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'financeiro-' + today() + '.csv';
  a.click();
  toast('Excel exportado!');
};

// =============================================
//  RELATORIOS
// =============================================
window.setRelPeriodo = function(p) {
  var now = new Date();
  var ini, fim;
  if (p === 'mes') { ini = new Date(now.getFullYear(), now.getMonth(), 1); fim = new Date(now.getFullYear(), now.getMonth() + 1, 0); }
  else if (p === 'anterior') { ini = new Date(now.getFullYear(), now.getMonth() - 1, 1); fim = new Date(now.getFullYear(), now.getMonth(), 0); }
  else if (p === 'trimestre') { ini = new Date(now.getFullYear(), now.getMonth() - 3, 1); fim = now; }
  else { ini = new Date(now.getFullYear(), 0, 1); fim = now; }
  document.getElementById('rel-inicio').value = ini.toISOString().split('T')[0];
  document.getElementById('rel-fim').value = fim.toISOString().split('T')[0];
};

window.gerarRelatorio = function() {
  var ini = document.getElementById('rel-inicio').value;
  var fim = document.getElementById('rel-fim').value;
  if (!ini || !fim) { toast('Selecione o periodo', 'err'); return; }
  var filtradas = transacoes.filter(function(t) { return t.data >= ini && t.data <= fim; });
  var entradas = filtradas.filter(function(t) { return t.tipo === 'entrada'; }).reduce(function(a,t) { return a + t.val; }, 0);
  var saidas   = filtradas.filter(function(t) { return t.tipo === 'saida'; }).reduce(function(a,t) { return a + t.val; }, 0);
  var pagos    = filtradas.filter(function(t) { return t.tipo === 'pag-divida'; }).reduce(function(a,t) { return a + t.val; }, 0);
  var reservaA = filtradas.filter(function(t) { return t.tipo === 'reserva'; }).reduce(function(a,t) { return a + t.val; }, 0);
  var negocs   = filtradas.filter(function(t) { return t.tipo === 'negociacao'; }).length;
  var saldo = entradas - saidas;
  document.getElementById('rel-summary').innerHTML =
    '<div class="rel-item"><div class="rel-item-label">Entradas</div><div class="rel-item-val g">' + fmt(entradas) + '</div></div>' +
    '<div class="rel-item"><div class="rel-item-label">Saidas</div><div class="rel-item-val r">' + fmt(saidas) + '</div></div>' +
    '<div class="rel-item"><div class="rel-item-label">Saldo</div><div class="rel-item-val ' + (saldo >= 0 ? 'g' : 'r') + '">' + fmt(saldo) + '</div></div>' +
    '<div class="rel-item"><div class="rel-item-label">Pago em dividas</div><div class="rel-item-val a">' + fmt(pagos) + '</div></div>' +
    '<div class="rel-item"><div class="rel-item-label">Reserva add.</div><div class="rel-item-val p">' + fmt(reservaA) + '</div></div>' +
    '<div class="rel-item"><div class="rel-item-label">Negociacoes</div><div class="rel-item-val b">' + negocs + '</div></div>';
  document.getElementById('rel-feed').innerHTML = filtradas.length
    ? filtradas.map(function(t) { return renderFeedItem(t, false); }).join('')
    : '<div class="feed-empty">Nenhuma transacao no periodo.</div>';
  document.getElementById('rel-resultado').style.display = 'block';
};

// =============================================
//  RENDER DASHBOARD
// =============================================
function renderDash() {
  var mes = new Date().toISOString().slice(0, 7);
  var entMes = transacoes.filter(function(t) { return t.tipo === 'entrada' && t.data && t.data.startsWith(mes); });
  var saiMes = transacoes.filter(function(t) { return t.tipo === 'saida' && t.data && t.data.startsWith(mes); });
  var totalE = entMes.reduce(function(a,t) { return a + t.val; }, 0);
  var totalS = saiMes.reduce(function(a,t) { return a + t.val; }, 0);
  var saldo = totalE - totalS;
  var divFora = dividas.filter(function(d) { return d.tipo === 'fora' && !d.quitada; }).reduce(function(a,d) { return a + d.total; }, 0);
  var divPP   = dividas.filter(function(d) { return d.tipo === 'picpay'; }).reduce(function(a,d) { return a + d.total; }, 0);
  var totalDiv = divFora + divPP;
  var origTotal = DIVIDAS_INIT.reduce(function(a,d) { return a + d.orig; }, 0);
  var quitadas = dividas.filter(function(d) { return d.quitada; }).length;
  var progPct = Math.min(100, Math.round(((origTotal - totalDiv) / origTotal) * 100));
  var reserva = metasProg.reserva || 0;
  var resPct = Math.min(100, Math.round((reserva / 10000) * 100));

  function s(id, v) { var el = document.getElementById(id); if (el) el.textContent = v; }
  s('d-saldo', fmt(saldo));
  s('d-ent', fmt(totalE));
  s('d-sai', fmt(totalS));
  s('d-divtot', fmt(totalDiv));
  s('d-quit', quitadas + ' de ' + dividas.length);
  s('d-reserva', fmt(reserva));
  s('d-prog-pct', progPct + '%');
  s('d-prog-info', 'Restam ' + fmt(totalDiv) + ' de ' + fmt(origTotal));
  s('d-res-pct', resPct + '%');
  s('d-res-info', fmt(reserva) + ' de R$ 10.000');

  var saldoEl = document.getElementById('d-saldo');
  if (saldoEl) saldoEl.className = 'metric-val ' + (saldo >= 0 ? 'g' : 'r');

  var bar = document.getElementById('d-prog-bar');
  if (bar) bar.style.width = progPct + '%';
  var resBar = document.getElementById('d-res-bar');
  if (resBar) resBar.style.width = resPct + '%';

  var urgentes = dividas.filter(function(d) { return !d.quitada && d.urg === 'red'; });
  var alertEl = document.getElementById('dash-alert');
  if (alertEl) {
    alertEl.style.display = urgentes.length > 0 ? 'block' : 'none';
    if (urgentes.length > 0) alertEl.textContent = urgentes.length + ' divida(s) com vencimento critico. Acesse Dividas > Parcelas do mes.';
  }

  var feedEl = document.getElementById('dash-feed');
  if (feedEl) {
    var recent = transacoes.slice(0, 6);
    feedEl.innerHTML = recent.length
      ? recent.map(function(t) { return renderFeedItem(t, false); }).join('')
      : '<div class="feed-empty">Nenhuma movimentacao registrada ainda.</div>';
  }
}

// =============================================
//  RENDER DIVIDAS
// =============================================
function renderDividas() {
  var ativas    = dividas.filter(function(d) { return d.tipo === 'fora' && !d.quitada; });
  var quitadasL = dividas.filter(function(d) { return d.tipo === 'fora' && d.quitada; });
  var picpayL   = dividas.filter(function(d) { return d.tipo === 'picpay'; });

  var totalFora   = ativas.reduce(function(a,d) { return a + d.total; }, 0);
  var totalPP     = picpayL.reduce(function(a,d) { return a + d.total; }, 0);
  var totalGeral  = totalFora + totalPP;
  var origFora    = DIVIDAS_INIT.filter(function(d) { return d.tipo === 'fora'; }).reduce(function(a,d) { return a + d.orig; }, 0);
  var origPP      = DIVIDAS_INIT.filter(function(d) { return d.tipo === 'picpay'; }).reduce(function(a,d) { return a + d.orig; }, 0);
  var origTotal   = origFora + origPP;
  var pct = Math.min(100, Math.round(((origTotal - totalGeral) / origTotal) * 100));

  function s(id, v) { var el = document.getElementById(id); if (el) el.textContent = v; }
  s('dv-total-geral', fmt(totalGeral));
  s('dv-total-fora', fmt(totalFora));
  var bar = document.getElementById('dv-bar');
  if (bar) bar.style.width = pct + '%';

  var ativasEl = document.getElementById('dv-ativas');
  if (ativasEl) ativasEl.innerHTML = ativas.length
    ? ativas.map(function(d) { return renderDivCard(d); }).join('')
    : '<div class="empty-state"><div class="empty-state-icon">Nenhuma divida ativa fora da folha!</div></div>';

  var ppEl = document.getElementById('dv-picpay');
  if (ppEl) ppEl.innerHTML = '<div class="alert al-blue" style="margin-bottom:1rem">Descontado automaticamente na folha. Voce pode adiantar parcelas.</div>' + picpayL.map(function(d) { return renderDivCard(d); }).join('');

  var qEl = document.getElementById('dv-quitadas');
  if (qEl) qEl.innerHTML = quitadasL.length
    ? quitadasL.map(function(d) { return renderDivCard(d); }).join('')
    : '<div class="empty-state"><div class="empty-state-icon">Nenhuma divida quitada ainda. Em breve!</div></div>';

  renderParcelas();
}

function renderParcelas() {
  var el = document.getElementById('dv-parcelas');
  if (!el) return;
  var hoje = new Date();
  var mesAtual = hoje.getMonth() + 1;
  var anoAtual = hoje.getFullYear();
  var ativas = dividas.filter(function(d) { return !d.quitada && d.parcMensal > 0; });
  if (!ativas.length) { el.innerHTML = '<div class="empty-state">Nenhuma parcela pendente.</div>'; return; }
  var sorted = ativas.slice().sort(function(a,b) { return (a.venceDia||0) - (b.venceDia||0); });
  var totalMes = sorted.reduce(function(a,d) { return a + d.parcMensal; }, 0);
  var nomeMes = hoje.toLocaleString('pt-BR', { month: 'long' });
  var html = '<div class="alert al-blue" style="margin-bottom:1rem">Parcelas de ' + nomeMes + ' de ' + anoAtual + ' | Total do mes: <strong>' + fmt(totalMes) + '</strong></div>';
  sorted.forEach(function(d) {
    var parcsRest = Math.max(0, (d.parcsTotal || 0) - (d.parcsPagas || 0));
    var diaStr = d.venceDia ? String(d.venceDia).padStart(2,'0') + '/' + String(mesAtual).padStart(2,'0') + '/' + anoAtual : (d.vence || '-');
    var diasP = d.venceDia ? d.venceDia - hoje.getDate() : 99;
    var urgClass = diasP < 0 ? 'al-red' : diasP <= 5 ? 'al-amber' : 'al-green';
    var urgText = diasP < 0 ? 'Vencida ha ' + Math.abs(diasP) + ' dias' : diasP === 0 ? 'Vence hoje!' : 'Vence em ' + diasP + ' dias';
    var bc = d.urg === 'red' ? 'b-red' : d.urg === 'amber' ? 'b-amber' : d.urg === 'green' ? 'b-green' : d.urg === 'blue' ? 'b-blue' : 'b-gray';
    var tagTipo = d.tipo === 'picpay' ? 'Folha' : 'Em aberto';
    html += '<div class="div-card" style="margin-bottom:.75rem">' +
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;margin-bottom:.5rem">' +
      '<div><div class="div-nome">' + d.nome + ' <span class="badge ' + bc + '">' + tagTipo + '</span></div>' +
      '<div class="div-meta">Parcela: <strong style="color:var(--accent)">' + fmt(d.parcMensal) + '</strong> | Vence: ' + diaStr + ' | Restam ' + parcsRest + ' de ' + (d.parcsTotal||0) + '</div></div>' +
      '<button class="btn btn-p btn-sm" onclick="pagarParcela(\'' + d.id + '\')">Pagar parcela</button>' +
      '</div>' +
      '<div class="alert ' + urgClass + '" style="padding:.5rem .75rem;font-size:12px;margin:0">' + urgText + '</div>' +
      '</div>';
  });
  el.innerHTML = html;
}

function renderDivCard(d) {
  var bc = d.urg === 'red' ? 'b-red' : d.urg === 'amber' ? 'b-amber' : d.urg === 'green' ? 'b-green' : d.urg === 'blue' ? 'b-blue' : 'b-gray';
  var ul = d.urg === 'red' ? 'Critico' : d.urg === 'amber' ? 'Urgente' : d.urg === 'green' ? 'Moderado' : d.urg === 'blue' ? 'Mensal' : 'Folha';
  var pago = d.pago || 0;
  var progPct = d.orig > 0 ? Math.min(100, Math.round((pago / d.orig) * 100)) : 0;
  var parcsRest = Math.max(0, (d.parcsTotal||0) - (d.parcsPagas||0));
  var negTag = d.negociada ? '<span class="badge b-blue" style="margin-left:6px">Negociada</span>' : '';
  var novaInfo = d.negociada && d.novaParcela ? '<div style="font-size:12px;color:var(--blue);margin-top:3px">Nova parcela: ' + fmt(d.novaParcela) + ' x ' + d.novaQtd + 'x | Total: ' + fmt(d.total) + (d.economia > 0 ? ' (economia: ' + fmt(d.economia) + ')' : '') + '</div>' : '';
  var parcInfo = d.parcMensal ? '<div style="font-size:12px;color:var(--muted);margin-top:2px">Parcela mensal: <strong style="color:var(--accent)">' + fmt(d.parcMensal) + '</strong> | ' + parcsRest + ' de ' + (d.parcsTotal||0) + ' restantes</div>' : '';

  if (d.quitada) return '<div class="div-card quitada"><div class="div-header"><div><div class="div-nome">' + d.nome + ' <span class="badge b-green">Quitada</span></div><div class="div-meta">Quitada em ' + fmtD(d.dataQuit) + ' | Original: ' + fmt(d.orig) + '</div></div><button class="btn btn-g btn-sm" onclick="reativarDivida(\'' + d.id + '\')">Desfazer</button></div></div>';

  var progBar = pago > 0 ? '<div class="div-prog-label"><span>Progresso</span><span>' + progPct + '%</span></div><div class="prog-wrap"><div class="prog-bar" style="width:' + progPct + '%;background:var(--accent)"></div></div>' : '';

  return '<div class="div-card' + (d.negociada ? ' negociada' : '') + '">' +
    '<div class="div-header">' +
    '<div style="flex:1"><div class="div-nome">' + d.nome + ' <span class="badge ' + bc + '">' + ul + '</span>' + negTag + '</div>' +
    '<div class="div-meta">Vence dia ' + (d.venceDia||'-') + ' | Original: ' + fmt(d.orig) + ' | <strong style="color:var(--red)">Restante: ' + fmt(d.total) + '</strong></div>' +
    parcInfo + novaInfo +
    (pago > 0 ? '<div style="font-size:12px;color:var(--accent);margin-top:2px">Pago: ' + fmt(pago) + '</div>' : '') +
    '</div>' +
    '<div class="div-actions">' +
    '<button class="btn btn-p btn-sm" onclick="pagarParcela(\'' + d.id + '\')">Pagar parcela</button>' +
    '<button class="btn btn-g btn-sm" onclick="goPage(\'controle\');switchTab(\'ctrl\',\'t-negoc\');document.getElementById(\'n-div\').value=\'' + d.id + '\'">Negociar</button>' +
    '<button class="btn btn-g btn-sm" onclick="goPage(\'controle\');switchTab(\'ctrl\',\'t-pagdiv\');document.getElementById(\'pd-div\').value=\'' + d.id + '\'">Pagar valor</button>' +
    '<button class="btn btn-p btn-sm" onclick="quitarDivida(\'' + d.id + '\')">Quitar</button>' +
    '</div></div>' +
    progBar + '</div>';
}

// =============================================
//  RENDER METAS
// =============================================
function renderMetas() {
  var el = document.getElementById('metas-lista');
  if (!el) return;
  var divFora   = dividas.filter(function(d) { return d.tipo === 'fora' && !d.quitada; }).reduce(function(a,d) { return a + d.total; }, 0);
  var divPP     = dividas.filter(function(d) { return d.tipo === 'picpay'; }).reduce(function(a,d) { return a + d.total; }, 0);
  var origTotal = DIVIDAS_INIT.reduce(function(a,d) { return a + d.orig; }, 0);
  var divPago   = Math.max(0, origTotal - divFora - divPP);

  el.innerHTML = METAS_DEF.map(function(m) {
    var atual = m.id === 'dividas' ? divPago : m.id === 'reserva' ? (metasProg.reserva||0) : m.id === 'meta50k' ? (metasProg.meta50k||0) : (metasProg.meta100k||0);
    var pct = Math.min(100, Math.round((atual / m.alvo) * 100));
    var cor = m.cor === 'red' ? 'var(--red)' : m.cor === 'purple' ? 'var(--purple)' : m.cor === 'blue' ? 'var(--blue)' : 'var(--accent)';
    var btnAdd = m.id !== 'dividas' ? '<button class="btn btn-g btn-sm" onclick="addMetaProg(\'' + m.id + '\')" style="margin-bottom:.75rem">+ Registrar valor</button>' : '';
    return '<div class="meta-card" style="border-left:3px solid ' + cor + '">' +
      '<div class="meta-header"><div><div class="meta-nome" style="color:' + cor + '">' + (pct >= 100 ? 'Concluida - ' : '') + m.nome + '</div><div style="font-size:12px;color:var(--muted);margin-top:3px">' + m.desc + '</div></div>' +
      '<div style="text-align:right;flex-shrink:0"><div class="meta-pct" style="color:' + cor + '">' + pct + '%</div><div style="font-size:11px;color:var(--muted)">concluido</div></div></div>' +
      '<div class="prog-wrap" style="margin-bottom:.75rem"><div class="prog-bar" style="width:' + pct + '%;background:' + cor + '"></div></div>' +
      '<div style="display:flex;justify-content:space-between;font-size:12px;color:var(--muted);margin-bottom:.75rem"><span>Acumulado: <strong style="color:' + cor + '">' + fmt(atual) + '</strong></span><span>Meta: <strong>' + fmt(m.alvo) + '</strong></span><span>Faltam: <strong style="color:var(--red)">' + fmt(Math.max(0, m.alvo - atual)) + '</strong></span></div>' +
      btnAdd +
      '<div class="meta-grid"><div class="meta-info-item"><div class="meta-info-label">O que fazer</div>' + m.acoes.map(function(a) { return '<div style="font-size:12px;margin-top:4px">- ' + a + '</div>'; }).join('') + '</div>' +
      '<div class="meta-info-item"><div class="meta-info-label">O que evitar</div>' + m.evitar.map(function(a) { return '<div style="font-size:12px;margin-top:4px;color:var(--red)">x ' + a + '</div>'; }).join('') + '</div></div></div>';
  }).join('');
}

window.addMetaProg = async function(id) {
  var val = parseFloat(prompt('Quanto adicionar a meta? (R$)'));
  if (!val || val <= 0) return;
  metasProg[id] = (metasProg[id] || 0) + val;
  await setDoc(uref('config/metas'), metasProg);
  await addDoc(ucol('transacoes'), { tipo: 'meta', label: 'Investimento - ' + id, val: val, data: today(), criadoEm: Date.now() });
  renderMetas();
  toast(fmt(val) + ' adicionado a meta!');
};

// =============================================
//  RENDER DESAFIOS
// =============================================
function renderDesafios() {
  var el = document.getElementById('desafios-lista');
  if (!el) return;
  if (!desafios.length) { el.innerHTML = '<div class="empty-state">Nenhum desafio criado ainda.</div>'; return; }
  el.innerHTML = desafios.map(function(d) {
    var pct = Math.min(100, Math.round(((d.pago||0) / d.meta) * 100));
    var diasR = Math.max(0, Math.ceil((new Date(d.vence) - new Date()) / 86400000));
    var btnPag = !d.concluido
      ? '<div style="display:flex;gap:6px;align-items:center;margin-top:.5rem"><input class="fi" type="number" placeholder="Valor" id="des-inp-' + d._docId + '" style="max-width:150px;margin:0" step="0.01"><button class="btn btn-p btn-sm" onclick="atualizarDesafio(\'' + d._docId + '\',parseFloat(document.getElementById(\'des-inp-' + d._docId + '\').value)||0)">+ Registrar</button><button class="btn btn-d btn-sm" onclick="excluirDesafio(\'' + d._docId + '\')">Excluir</button></div>'
      : '<span class="badge b-green">Concluido!</span>';
    return '<div class="desafio-card' + (d.concluido ? ' concluido' : '') + '">' +
      '<div class="desafio-header"><div><div class="desafio-nome">' + d.nome + (d.concluido ? ' 🏆' : '') + '</div><div style="font-size:12px;color:var(--muted);margin-top:2px">' + d.divNome + ' | ' + d.prazo + ' ' + d.unidade + ' | Vence: ' + fmtD(d.vence) + '</div></div>' +
      '<div style="text-align:right"><div class="desafio-dias">' + diasR + '</div><div style="font-size:11px;color:var(--muted)">dias restantes</div></div></div>' +
      '<div style="display:flex;justify-content:space-between;font-size:12px;color:var(--muted);margin-bottom:5px"><span>Pago: ' + fmt(d.pago||0) + '</span><span>Meta: ' + fmt(d.meta) + '</span><span>' + pct + '%</span></div>' +
      '<div class="prog-wrap" style="margin-bottom:.5rem"><div class="prog-bar" style="width:' + pct + '%;background:var(--amber)"></div></div>' +
      btnPag + '</div>';
  }).join('');
}

// =============================================
//  FEED
// =============================================
window.filtHist = function(filtro, btn) {
  histFiltro = filtro;
  document.querySelectorAll('.chip').forEach(function(c) { c.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  renderHist(filtro);
};

function renderHist(filtro) {
  var el = document.getElementById('hist-feed');
  if (!el) return;
  var items = filtro === 'todos' ? transacoes : transacoes.filter(function(t) { return t.tipo === filtro; });
  el.innerHTML = items.length ? items.map(function(t) { return renderFeedItem(t, true); }).join('') : '<div class="feed-empty">Nenhum registro encontrado.</div>';
}

function renderFeedItem(t, showDelete) {
  var isPos = ['entrada','reserva','meta'].indexOf(t.tipo) >= 0;
  var isNeg = ['saida','pag-divida'].indexOf(t.tipo) >= 0;
  var valHtml = isPos ? '<div class="feed-val pos">+' + fmt(t.val) + '</div>' : isNeg ? '<div class="feed-val neg">-' + fmt(t.val) + '</div>' : (t.val ? '<div class="feed-val a">' + fmt(t.val) + '</div>' : '');
  var desc = t.tipo === 'negociacao' ? (t.divida + ' - ' + (t.resLabel||'') + (t.parc ? ' | ' + fmt(t.parc) + ' x ' + t.qtd + 'x' : '')) : (t.label || t.divida || '');
  var obs = (t.desc || t.obs) ? ' <span style="color:var(--muted)">- ' + (t.desc || t.obs) + '</span>' : '';
  var del = showDelete ? '<button class="btn btn-g btn-sm" onclick="excluirTx(\'' + t._docId + '\')" style="padding:2px 7px;margin-left:4px">x</button>' : '';
  return '<div class="feed-item ' + t.tipo + '"><div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:500;word-break:break-word">' + desc + obs + '</div><div class="feed-meta">' + fmtD(t.data) + ' - ' + t.tipo + '</div></div><div style="display:flex;align-items:center;gap:4px;flex-shrink:0">' + valHtml + del + '</div></div>';
}

window.excluirTx = async function(docId) {
  await deleteDoc(doc(db, 'users', uid(), 'transacoes', docId));
  toast('Registro removido.');
};

// =============================================
//  MODALS
// =============================================
window.closeModal = function() {
  document.querySelectorAll('.modal-overlay').forEach(function(m) { m.classList.remove('open'); });
};

window.confirmarLimpar = function() {
  document.getElementById('modal-msg').textContent = 'Isso apagara TODAS as transacoes. As dividas voltam ao estado inicial. Nao pode ser desfeito.';
  document.getElementById('modal-confirm-btn').onclick = limparTudo;
  document.getElementById('modal-confirm').classList.add('open');
};

async function limparTudo() {
  closeModal();
  var snap = await getDocs(ucol('transacoes'));
  for (var i = 0; i < snap.docs.length; i++) await deleteDoc(snap.docs[i].ref);
  for (var j = 0; j < DIVIDAS_INIT.length; j++) await setDoc(doc(db, 'users', uid(), 'dividas', DIVIDAS_INIT[j].id), DIVIDAS_INIT[j]);
  await setDoc(uref('config/metas'), { reserva: 0, meta50k: 0, meta100k: 0 });
  metasProg = { reserva: 0, meta50k: 0, meta100k: 0 };
  toast('Dados limpos.');
}

// =============================================
//  CLEAR FORMS
// =============================================
window.clearForm = function(form) {
  var maps = {
    entrada:  [['e-val',''],['e-desc','']],
    saida:    [['s-val',''],['s-desc','']],
    negoc:    [['n-parc',''],['n-qtd',''],['n-obs','']],
    pagdiv:   [['pd-val',''],['pd-obs','']],
    reserva:  [['rv-val',''],['rv-obs','']],
    desafio:  [['des-nome',''],['des-meta',''],['des-prazo','']],
  };
  (maps[form] || []).forEach(function(pair) {
    var el = document.getElementById(pair[0]);
    if (el) el.value = pair[1];
  });
};
