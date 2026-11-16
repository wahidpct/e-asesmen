// ============================================================
// E-ASESMEN MANDIRI — Logic Admin
// ©noer_w@smkn3pct
// ============================================================

let bankSoal = [];
let selectedSoal = new Set();

// ============ TAB SWITCHING ============
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const tab = btn.dataset.tab;
    document.getElementById('buatSesiPage').classList.toggle('hidden', tab !== 'buatSesi');
    document.getElementById('tambahSoalPage').classList.toggle('hidden', tab !== 'tambahSoal');
    document.getElementById('hasilPage').classList.add('hidden');
  });
});

// ============ LOAD BANK SOAL ============
async function loadBankSoal() {
  try {
    const res = await fetch(`${CONFIG.API_URL}?action=getBankSoal`);
    const data = await res.json();
    bankSoal = data;
    renderSoalList();
  } catch (err) {
    document.getElementById('soalList').innerHTML =
      `<p class="error">❌ Gagal memuat soal: ${err.message}</p>`;
  }
}

function renderSoalList() {
  const filterTipe = document.getElementById('filterTipe').value;
  const search = document.getElementById('searchSoal').value.toLowerCase();
  const list = bankSoal.filter(s => {
    if (filterTipe !== 'all' && s.tipe !== filterTipe) return false;
    if (search && !s.soal.toLowerCase().includes(search)) return false;
    return true;
  });

  if (list.length === 0) {
    document.getElementById('soalList').innerHTML = '<p class="loading">Tidak ada soal.</p>';
    return;
  }

  document.getElementById('soalList').innerHTML = list.map(s => `
    <label class="soal-item ${selectedSoal.has(s.id) ? 'checked' : ''}">
      <input type="checkbox" data-id="${s.id}" ${selectedSoal.has(s.id) ? 'checked' : ''} />
      <div class="soal-item-body">
        <span class="tag ${s.tipe}">${s.tipe === 'pg' ? 'PG' : 'ISIAN'}</span>
        ${s.gambar ? `<img src="${escapeHtml(convertDriveUrl(s.gambar))}"
                           class="thumb" alt=""
                           onerror="this.style.display='none'">` : ''}
        <span class="soal-text">${escapeHtml(s.soal)}</span>
      </div>
    </label>
  `).join('');

  document.querySelectorAll('.soal-item input[type=checkbox]').forEach(cb => {
    cb.addEventListener('change', (e) => {
      const id = Number(e.target.dataset.id);
      if (e.target.checked) selectedSoal.add(id);
      else selectedSoal.delete(id);
      e.target.closest('.soal-item').classList.toggle('checked', e.target.checked);
      updateSelectedCount();
    });
  });

  updateSelectedCount();
}

function updateSelectedCount() {
  document.getElementById('selectedCount').textContent = `${selectedSoal.size} dipilih`;
}

// ============ EVENT FILTER ============
document.getElementById('filterTipe').addEventListener('change', renderSoalList);
document.getElementById('searchSoal').addEventListener('input', renderSoalList);
document.getElementById('selectAllBtn').addEventListener('click', () => {
  const filterTipe = document.getElementById('filterTipe').value;
  bankSoal.forEach(s => {
    if (filterTipe === 'all' || s.tipe === filterTipe) selectedSoal.add(s.id);
  });
  renderSoalList();
});
document.getElementById('selectNoneBtn').addEventListener('click', () => {
  selectedSoal.clear();
  renderSoalList();
});

// ============ BUAT SESI ============
document.getElementById('buatSesiBtn').addEventListener('click', async () => {
  const namaSesi = document.getElementById('namaSesi').value.trim();
  const durasi = document.querySelector('input[name="durasi"]:checked').value;

  if (!namaSesi) return alert('Nama sesi wajib diisi!');
  if (selectedSoal.size === 0) return alert('Pilih minimal 1 soal!');

  const soalIds = bankSoal.filter(s => selectedSoal.has(s.id)).map(s => s.id);

  const payload = {
    action: 'buatSesi',
    nama_sesi: namaSesi,
    soal_ids: soalIds,
    durasi: Number(durasi),
    acak_soal: document.getElementById('acakSoal').checked,
    acak_opsi: document.getElementById('acakOpsi').checked,
    base_url: location.origin + location.pathname.replace('admin.html', 'index.html'),
  };

  const btn = document.getElementById('buatSesiBtn');
  btn.disabled = true;
  btn.textContent = '⏳ Membuat sesi...';

  try {
    await fetch(CONFIG.API_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });

    await new Promise(r => setTimeout(r, 1500));
    const sesiList = await fetch(`${CONFIG.API_URL}?action=getListSesi`).then(r => r.json());
    const latest = sesiList[sesiList.length - 1];
    if (!latest) throw new Error('Sesi tidak terbentuk');

    document.getElementById('outToken').textContent = latest.token;
    document.getElementById('outLink').value =
      `${location.origin}${location.pathname.replace('admin.html', 'index.html')}?token=${latest.token}`;
    document.getElementById('hasilSesi').classList.remove('hidden');
    document.getElementById('hasilSesi').dataset.idSesi = latest.id_sesi;

    btn.textContent = '✅ Sesi Dibuat';
  } catch (err) {
    alert('Gagal membuat sesi: ' + err.message);
    btn.disabled = false;
    btn.textContent = '🚀 Generate Link Ujian';
  }
});

// ============ COPY LINK ============
document.getElementById('copyLinkBtn').addEventListener('click', () => {
  const inp = document.getElementById('outLink');
  inp.select();
  document.execCommand('copy');
  document.getElementById('copyLinkBtn').textContent = '✓ Tersalin';
  setTimeout(() => document.getElementById('copyLinkBtn').textContent = 'Copy', 1500);
});

// ============ LIHAT HASIL ============
document.getElementById('lihatHasilBtn').addEventListener('click', async () => {
  const idSesi = document.getElementById('hasilSesi').dataset.idSesi;
  const res = await fetch(`${CONFIG.API_URL}?action=getHasil&id_sesi=${idSesi}`);
  const data = await res.json();

  ['buatSesiPage', 'tambahSoalPage'].forEach(id => document.getElementById(id).classList.add('hidden'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('hasilPage').classList.remove('hidden');
  document.getElementById('hasilSubtitle').textContent = `${data.length} peserta telah mengerjakan`;

  if (data.length === 0) {
    document.getElementById('hasilTable').innerHTML = '<p>Belum ada yang mengerjakan.</p>';
    return;
  }

  document.getElementById('hasilTable').innerHTML = `
    <table class="result-table">
      <thead>
        <tr><th>Nama</th><th>Kelas</th><th>Skor</th><th>Benar</th><th>Pelanggaran</th></tr>
      </thead>
      <tbody>
        ${data.map(r => `
          <tr>
            <td>${escapeHtml(r.nama)}</td>
            <td>${escapeHtml(r.kelas)}</td>
            <td><strong>${r.skor}</strong></td>
            <td>${r.benar}/${r.total}</td>
            <td>${r.pelanggaran}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
});

document.getElementById('kembaliBtn').addEventListener('click', () => {
  document.getElementById('hasilPage').classList.add('hidden');
  document.getElementById('buatSesiPage').classList.remove('hidden');
  document.querySelector('.tab-btn[data-tab="buatSesi"]').classList.add('active');
});

// ============ TAMBAH SOAL BARU ============
document.getElementById('newTipe').addEventListener('change', (e) => {
  document.getElementById('pgFields').style.display =
    e.target.value === 'pg' ? 'block' : 'none';
});

document.getElementById('newGambar').addEventListener('input', (e) => {
  const url = convertDriveUrl(e.target.value);
  const preview = document.getElementById('previewGambar');
  if (!url) { preview.innerHTML = ''; return; }
  preview.innerHTML = `
    <div class="question-image" style="margin-top:10px;">
      <img src="${escapeHtml(url)}" alt="Preview"
           onerror="this.parentElement.innerHTML='<p class=&quot;img-error&quot;>❌ Gambar gagal dimuat. Cek akses publik link.</p>'" />
    </div>`;
});

document.getElementById('simpanSoalBtn').addEventListener('click', async () => {
  const tipe = document.getElementById('newTipe').value;
  const soal = document.getElementById('newSoal').value.trim();
  const gambar = document.getElementById('newGambar').value.trim();
  const jawaban = document.getElementById('newJawaban').value.trim();
  const pilihanRaw = document.getElementById('newPilihan').value.trim();
  const msg = document.getElementById('simpanSoalMsg');

  if (!soal) return (msg.textContent = '❌ Pertanyaan wajib diisi!');
  if (!jawaban) return (msg.textContent = '❌ Kunci jawaban wajib diisi!');

  let pilihan = [];
  if (tipe === 'pg') {
    pilihan = pilihanRaw.split('\n').map(s => s.trim()).filter(Boolean);
    if (pilihan.length < 2) return (msg.textContent = '❌ Minimal 2 pilihan jawaban!');
    if (!pilihan.includes(jawaban)) return (msg.textContent = '❌ Kunci jawaban harus salah satu dari pilihan!');
  }

  const payload = {
    action: 'tambahSoal',
    tipe, soal, gambar, pilihan, jawaban,
  };

  const btn = document.getElementById('simpanSoalBtn');
  btn.disabled = true;
  btn.textContent = '⏳ Menyimpan...';

  try {
    await fetch(CONFIG.API_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });
    await new Promise(r => setTimeout(r, 1500));
    await loadBankSoal();

    msg.textContent = '✅ Soal berhasil disimpan!';
    msg.classList.add('success');
    document.getElementById('newSoal').value = '';
    document.getElementById('newGambar').value = '';
    document.getElementById('newJawaban').value = '';
    document.getElementById('newPilihan').value = '';
    document.getElementById('previewGambar').innerHTML = '';
  } catch (err) {
    msg.textContent = '❌ Gagal menyimpan: ' + err.message;
  }

  btn.disabled = false;
  btn.textContent = '💾 Simpan Soal';
});

// ============ UTIL ============
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Init
loadBankSoal();