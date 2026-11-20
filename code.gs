// ============================================================
// BACKEND E-ASESMEN MANDIRI — Google Apps Script
// ©noer_w@smkn3pct
// ============================================================

const SHEET_BANK  = 'BankSoal';
const SHEET_SESI  = 'Sesi';
const SHEET_HASIL = 'Hasil';

// ============ GET ============
function doGet(e) {
  const action = e.parameter.action || '';
  try {
    if (action === 'getSesi')     return response(getSesi(e.parameter.token));
    if (action === 'getBankSoal') return response(getBankSoal());
    if (action === 'getHasil')    return response(getHasil(e.parameter.id_sesi || ''));
    if (action === 'getListSesi') return response(getListSesi());
    return response({ status: 'error', message: 'Action tidak dikenal' });
  } catch (err) {
    return response({ status: 'error', message: err.toString() });
  }
}

// ============ POST ============
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.action === 'buatSesi')   return response(buatSesi(data));
    if (data.action === 'kirimHasil') return response(simpanHasil(data));
    if (data.action === 'tambahSoal') return response(tambahSoal(data));
    return response({ status: 'error', message: 'Action tidak dikenal' });
  } catch (err) {
    return response({ status: 'error', message: err.toString() });
  }
}

function response(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
  } else if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  }
  return sheet;
}

function sheetToObjects(sheet) {
  const rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1).map(r => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = r[i]);
    return obj;
  });
}

// ============ BANK SOAL ============
function getBankSoal() {
  const sheet = getSheet(SHEET_BANK, ['id','tipe','soal','gambar','pilihan','jawaban','aktif']);
  return sheetToObjects(sheet)
    .filter(r => String(r.aktif).toUpperCase() === 'TRUE')
    .map(r => {
      let pilihan = [];
      if (r.tipe === 'pg' && r.pilihan) {
        try { pilihan = JSON.parse(r.pilihan); }
        catch (err) { pilihan = String(r.pilihan).split(',').map(s => s.trim()); }
      }
      return {
        id: Number(r.id),
        tipe: r.tipe,
        soal: r.soal,
        gambar: r.gambar || '',
        pilihan: pilihan,
        jawaban: r.jawaban,
      };
    });
}

function tambahSoal(data) {
  const sheet = getSheet(SHEET_BANK, ['id','tipe','soal','gambar','pilihan','jawaban','aktif']);
  const lastId = Math.max(0, ...sheetToObjects(sheet).map(r => Number(r.id) || 0));
  sheet.appendRow([
    lastId + 1,
    data.tipe,
    data.soal,
    data.gambar || '',
    data.tipe === 'pg' ? JSON.stringify(data.pilihan) : '',
    data.jawaban,
    'TRUE',
  ]);
  return { status: 'ok', id: lastId + 1 };
}

// ============ SESI ============
function buatSesi(data) {
  const sheet = getSheet(SHEET_SESI, [
    'id_sesi','nama_sesi','soal_ids','durasi',
    'acak_soal','acak_opsi','token','waktu_dibuat','status'
  ]);
  const idSesi = 'S' + Date.now();
  const token = Math.random().toString(36).substring(2, 8).toUpperCase();
  sheet.appendRow([
    idSesi,
    data.nama_sesi,
    JSON.stringify(data.soal_ids),
    data.durasi,
    data.acak_soal ? 'TRUE' : 'FALSE',
    data.acak_opsi ? 'TRUE' : 'FALSE',
    token,
    new Date().toISOString(),
    'aktif',
  ]);
  return {
    status: 'ok', id_sesi: idSesi, token: token,
    link_peserta: `${data.base_url}?token=${token}`,
  };
}

function getListSesi() {
  const sheet = getSheet(SHEET_SESI, [
    'id_sesi','nama_sesi','soal_ids','durasi',
    'acak_soal','acak_opsi','token','waktu_dibuat','status'
  ]);
  return sheetToObjects(sheet).map(r => ({
    id_sesi: r.id_sesi, nama_sesi: r.nama_sesi,
    jumlah_soal: JSON.parse(r.soal_ids || '[]').length,
    durasi: Number(r.durasi), token: r.token,
    waktu_dibuat: r.waktu_dibuat, status: r.status,
  }));
}

function getSesi(token) {
  if (!token) return { status: 'error', message: 'Token kosong' };

  const sheet = getSheet(SHEET_SESI, [
    'id_sesi','nama_sesi','soal_ids','durasi',
    'acak_soal','acak_opsi','token','waktu_dibuat','status'
  ]);
  const sesi = sheetToObjects(sheet).find(r => r.token === token);
  if (!sesi) return { status: 'error', message: 'Token tidak valid' };
  if (String(sesi.status).toLowerCase() !== 'aktif')
    return { status: 'error', message: 'Sesi tidak aktif' };

  const soalIds = JSON.parse(sesi.soal_ids || '[]');
  const allSoal = getBankSoal();
  let soal = soalIds
    .map(id => allSoal.find(s => s.id === Number(id)))
    .filter(Boolean);

  if (String(sesi.acak_soal).toUpperCase() === 'TRUE') soal = shuffle(soal);
  if (String(sesi.acak_opsi).toUpperCase() === 'TRUE') {
    soal = soal.map(s => s.tipe === 'pg' ? { ...s, pilihan: shuffle([...s.pilihan]) } : s);
  }

  // Hapus kunci jawaban sebelum dikirim ke client
  const soalUntukClient = soal.map(s => ({
    id: s.id,
    tipe: s.tipe,
    soal: s.soal,
    gambar: s.gambar,
    pilihan: s.pilihan,
  }));

  return {
    status: 'ok',
    sesi: { id_sesi: sesi.id_sesi, nama_sesi: sesi.nama_sesi, durasi: Number(sesi.durasi) },
    soal: soalUntukClient,
  };
}

// ============ HASIL ============
function simpanHasil(data) {
  const sheet = getSheet(SHEET_HASIL, [
    'timestamp','id_sesi','nama','kelas',
    'skor','benar','total','pelanggaran','detail'
  ]);

  const sesiSheet = getSheet(SHEET_SESI, [
    'id_sesi','nama_sesi','soal_ids','durasi',
    'acak_soal','acak_opsi','token','waktu_dibuat','status'
  ]);
  const sesi = sheetToObjects(sesiSheet).find(r => r.id_sesi === data.id_sesi);
  if (!sesi) return { status: 'error', message: 'Sesi tidak ditemukan' };

  const soalIds = JSON.parse(sesi.soal_ids || '[]');
  const allSoal = getBankSoal();
  const soalMap = {};
  soalIds.forEach(id => {
    const s = allSoal.find(x => x.id === Number(id));
    if (s) soalMap[s.id] = s;
  });

  let benar = 0;
  const detail = [];
  (data.jawaban || []).forEach(j => {
    const soal = soalMap[j.id];
    if (!soal) return;
    const userAns = String(j.jawaban || '').trim();
    const isCorrect = userAns.toLowerCase() === String(soal.jawaban).toLowerCase();
    if (isCorrect) benar++;
    detail.push({
      id: soal.id,
      jawaban_user: userAns,
      jawaban_benar: soal.jawaban,
      benar: isCorrect,
    });
  });

  const total = soalIds.length;
  const skor = total > 0 ? Math.round((benar / total) * 100) : 0;

  sheet.appendRow([
    new Date().toISOString(),
    data.id_sesi,
    data.nama,
    data.kelas,
    skor,
    benar,
    total,
    data.pelanggaran || 0,
    JSON.stringify(detail),
  ]);

  return { status: 'ok', skor: skor, benar: benar, total: total };
}

function getHasil(idSesi) {
  const sheet = getSheet(SHEET_HASIL, [
    'timestamp','id_sesi','nama','kelas',
    'skor','benar','total','pelanggaran','detail'
  ]);
  let rows = sheetToObjects(sheet);
  if (idSesi) rows = rows.filter(r => r.id_sesi === idSesi);
  return rows;
}

// ============ UTIL ============
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}