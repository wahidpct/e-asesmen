// ============================================================
// E-ASESMEN MANDIRI — Logic Peserta
// ©noer_w@smkn3pct
// ============================================================

const state = {
  nama: '', kelas: '',
  idSesi: '', durasi: 60,
  soal: [], current: 0, answers: [],
  timer: null, waktuTersisa: 0,
  selesai: false, pelanggaran: 0, warningShown: false,
};

const els = {
  loginPage:         document.getElementById('loginPage'),
  quizPage:          document.getElementById('quizPage'),
  resultPage:        document.getElementById('resultPage'),
  loginForm:         document.getElementById('loginForm'),
  loginMsg:          document.getElementById('loginMsg'),
  infoSesi:          document.getElementById('infoSesi'),
  mulaiBtn:          document.getElementById('mulaiBtn'),
  pesertaInfo:       document.getElementById('pesertaInfo'),
  timer:             document.getElementById('timer'),
  progressText:      document.getElementById('progressText'),
  questionContainer: document.getElementById('questionContainer'),
  prevBtn:           document.getElementById('prevBtn'),
  nextBtn:           document.getElementById('nextBtn'),
  submitBtn:         document.getElementById('submitBtn'),
  warningOverlay:    document.getElementById('warningOverlay'),
  warningText:       document.getElementById('warningText'),
  warningOk:         document.getElementById('warningOk'),
};

// ============ LOAD SESI DARI URL TOKEN ============
const urlParams = new URLSearchParams(location.search);
const token = urlParams.get('token');

async function init() {
  if (!token) {
    els.infoSesi.textContent = '❌ Token ujian tidak ditemukan di URL.';
    els.infoSesi.classList.add('msg');
    return;
  }
  try {
    const res = await fetch(`${CONFIG.API_URL}?action=getSesi&token=${token}`);
    const data = await res.json();

    if (data.status !== 'ok') {
      els.infoSesi.textContent = `❌ ${data.message || 'Gagal memuat sesi'}`;
      els.infoSesi.classList.add('msg');
      return;
    }

    state.idSesi = data.sesi.id_sesi;
    state.durasi = data.sesi.durasi;
    state.soal = data.soal;
    state.answers = new Array(state.soal.length).fill('');

    els.infoSesi.textContent =
      `📚 ${data.sesi.nama_sesi} — ${state.soal.length} soal — ${state.durasi} menit`;
    els.mulaiBtn.disabled = false;
    els.mulaiBtn.textContent = '🚀 Mulai Evaluasi';
  } catch (err) {
    els.infoSesi.textContent = `❌ Error: ${err.message}`;
    els.infoSesi.classList.add('msg');
  }
}

// ============ LOGIN → MULAI ============
els.loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  state.nama = document.getElementById('nama').value.trim();
  state.kelas = document.getElementById('kelas').value.trim();
  if (!state.nama || !state.kelas) return;

  state.waktuTersisa = state.durasi * 60;
  state.current = 0;
  state.selesai = false;

  els.loginPage.classList.add('hidden');
  els.quizPage.classList.remove('hidden');
  els.pesertaInfo.textContent = `${state.nama} — ${state.kelas}`;

  startTimer();
  renderQuestion();
  aktifkanAntiCheat();
});

// ============ TIMER ============
function startTimer() {
  updateTimerDisplay();
  state.timer = setInterval(() => {
    state.waktuTersisa--;
    updateTimerDisplay();
    if (state.waktuTersisa <= 300) els.timer.classList.add('timer-warning');
    if (state.waktuTersisa <= 0) {
      clearInterval(state.timer);
      alert('⏰ Waktu habis! Jawaban akan dikirim otomatis.');
      finishQuiz();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const jam = Math.floor(state.waktuTersisa / 3600);
  const m = Math.floor((state.waktuTersisa % 3600) / 60).toString().padStart(2, '0');
  const s = (state.waktuTersisa % 60).toString().padStart(2, '0');
  els.timer.textContent = jam > 0 ? `${jam}:${m}:${s}` : `${m}:${s}`;
}

// ============ RENDER SOAL ============
function renderQuestion() {
  const q = state.soal[state.current];
  els.progressText.textContent = `${state.current + 1} / ${state.soal.length}`;

  let html = `<div class="question">
    <p class="question-text"><strong>${state.current + 1}.</strong> ${escapeHtml(q.soal)}</p>`;

  // Gambar soal (jika ada)
  if (q.gambar) {
    const imgUrl = convertDriveUrl(q.gambar);
    html += `
      <div class="question-image">
        <img src="${escapeHtml(imgUrl)}" alt="Gambar soal"
             onerror="this.parentElement.innerHTML='<p class=&quot;img-error&quot;>⚠️ Gambar tidak dapat dimuat. Pastikan link dapat diakses publik.</p>'" />
      </div>`;
  }

  if (q.tipe === 'pg') {
    q.pilihan.forEach((p, i) => {
      const checked  = state.answers[state.current] === p ? 'checked'  : '';
      const selected = state.answers[state.current] === p ? 'selected' : '';
      html += `<label class="option ${selected}">
        <input type="radio" name="q${state.current}" value="${escapeHtml(p)}" ${checked} />
        <span>${String.fromCharCode(65 + i)}. ${escapeHtml(p)}</span>
      </label>`;
    });
  } else {
    html += `<input type="text" class="short-answer" id="shortInput"
      placeholder="Tulis jawaban..." value="${escapeHtml(state.answers[state.current] || '')}"
      autocomplete="off" />`;
  }
  html += `</div>`;
  els.questionContainer.innerHTML = html;

  if (q.tipe === 'pg') {
    els.questionContainer.querySelectorAll('input[type=radio]').forEach(r => {
      r.addEventListener('change', (e) => {
        state.answers[state.current] = e.target.value;
        els.questionContainer.querySelectorAll('.option')
          .forEach(o => o.classList.remove('selected'));
        e.target.closest('.option').classList.add('selected');
      });
    });
  } else {
    const inp = document.getElementById('shortInput');
    inp.addEventListener('input', e => state.answers[state.current] = e.target.value);
    inp.focus();
  }

  els.prevBtn.disabled = state.current === 0;
  if (state.current === state.soal.length - 1) {
    els.nextBtn.classList.add('hidden');
    els.submitBtn.classList.remove('hidden');
  } else {
    els.nextBtn.classList.remove('hidden');
    els.submitBtn.classList.add('hidden');
  }
}

function escapeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// ============ NAVIGASI ============
els.prevBtn.addEventListener('click', () => {
  if (state.current > 0) { state.current--; renderQuestion(); }
});
els.nextBtn.addEventListener('click', () => {
  if (state.current < state.soal.length - 1) { state.current++; renderQuestion(); }
});
els.submitBtn.addEventListener('click', () => {
  if (!confirm('Yakin mengirim jawaban? Tidak bisa diubah lagi.')) return;
  finishQuiz();
});

// ============ SELESAI ============
async function finishQuiz() {
  if (state.selesai) return;
  state.selesai = true;
  clearInterval(state.timer);
  nonaktifkanAntiCheat();

  const payload = {
    action: 'kirimHasil',
    id_sesi: state.idSesi,
    nama: state.nama,
    kelas: state.kelas,
    pelanggaran: state.pelanggaran,
    jawaban: state.soal.map((q, i) => ({
      id: q.id,
      jawaban: state.answers[i] || '',
    })),
  };

  try {
    await fetch(CONFIG.API_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });
    await new Promise(r => setTimeout(r, 1500));
  } catch (err) {
    console.error('Gagal kirim:', err);
  }

  els.quizPage.classList.add('hidden');
  els.resultPage.classList.remove('hidden');
  document.getElementById('resNama').textContent = state.nama;
  document.getElementById('resKelas').textContent = state.kelas;
  document.getElementById('resTotal').textContent = state.soal.length;
}

// ============ ANTI-CHEAT ============
const acHandlers = {};

function aktifkanAntiCheat() {
  acHandlers.contextmenu = (e) => { e.preventDefault(); catat('Klik kanan tidak diizinkan!'); return false; };
  acHandlers.copy  = (e) => { e.preventDefault(); catat('Menyalin tidak diizinkan!'); return false; };
  acHandlers.cut   = (e) => { e.preventDefault(); catat('Memotong tidak diizinkan!'); return false; };
  acHandlers.paste = (e) => { e.preventDefault(); catat('Menempel tidak diizinkan!'); return false; };
  acHandlers.keydown = (e) => {
    if (e.key === 'F12') { e.preventDefault(); catat('Developer Tools dilarang!'); return false; }
    if (e.ctrlKey && e.shiftKey && ['I','J','C'].includes(e.key.toUpperCase())) {
      e.preventDefault(); catat('Developer Tools dilarang!'); return false;
    }
    if (e.ctrlKey && e.key.toUpperCase() === 'U') {
      e.preventDefault(); catat('View Source dilarang!'); return false;
    }
    if (e.ctrlKey && ['A','C','V','X'].includes(e.key.toUpperCase())) {
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea') return true;
      e.preventDefault(); catat('Shortcut dilarang!'); return false;
    }
  };
  acHandlers.visibilitychange = () => { if (document.hidden) catat('Anda meninggalkan halaman ujian!'); };
  acHandlers.dragstart = (e) => e.preventDefault();
  acHandlers.selectstart = (e) => {
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea') return true;
    e.preventDefault(); return false;
  };
  document.addEventListener('contextmenu', acHandlers.contextmenu);
  document.addEventListener('copy', acHandlers.copy);
  document.addEventListener('cut', acHandlers.cut);
  document.addEventListener('paste', acHandlers.paste);
  document.addEventListener('keydown', acHandlers.keydown);
  document.addEventListener('visibilitychange', acHandlers.visibilitychange);
  document.addEventListener('dragstart', acHandlers.dragstart);
  document.addEventListener('selectstart', acHandlers.selectstart);
}

function nonaktifkanAntiCheat() {
  document.removeEventListener('contextmenu', acHandlers.contextmenu);
  document.removeEventListener('copy', acHandlers.copy);
  document.removeEventListener('cut', acHandlers.cut);
  document.removeEventListener('paste', acHandlers.paste);
  document.removeEventListener('keydown', acHandlers.keydown);
  document.removeEventListener('visibilitychange', acHandlers.visibilitychange);
  document.removeEventListener('dragstart', acHandlers.dragstart);
  document.removeEventListener('selectstart', acHandlers.selectstart);
  els.warningOverlay.classList.add('hidden');
}

let warningQueue = [];
function catat(pesan) {
  if (state.selesai) return;
  state.pelanggaran++;
  warningQueue.push(pesan);
  if (!state.warningShown) tampilkanWarning();
}
function tampilkanWarning() {
  if (warningQueue.length === 0) {
    state.warningShown = false;
    els.warningOverlay.classList.add('hidden');
    return;
  }
  state.warningShown = true;
  const pesan = warningQueue.shift();
  els.warningText.textContent =
    `${pesan}\n\nPelanggaran: ${state.pelanggaran} kali. Jika terus berlanjut, ujian dapat didiskualifikasi.`;
  els.warningText.style.whiteSpace = 'pre-line';
  els.warningOverlay.classList.remove('hidden');
}
els.warningOk.addEventListener('click', () => {
  els.warningOverlay.classList.add('hidden');
  tampilkanWarning();
});

// Start
init();