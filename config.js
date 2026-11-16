// ============================================================
// KONFIGURASI E-ASESMEN MANDIRI
// ============================================================

const CONFIG = {
  // ⚠️ GANTI dengan URL Web App Google Apps Script Anda
  // Format: 'https://script.google.com/macros/s/XXXXX/exec'
  API_URL: 'https://script.google.com/macros/s/AKfycbw2Vc39CLwGEC5jMgIhPdlr_8dx8vem3LgnnD3kDfURc4CAeGMIMGNM43WWqRrPf8k6/exec',
};

// ============================================================
// Konversi link Google Drive menjadi URL gambar langsung
// ============================================================
function convertDriveUrl(url) {
  if (!url) return '';
  url = String(url).trim();
  if (!url) return '';

  // Sudah direct link — pakai apa adanya
  if (url.includes('lh3.googleusercontent.com')) return url;
  if (url.includes('uc?export=view')) return url;
  if (url.includes('uc?id=')) return url;

  // Cari file ID dari berbagai pola link Google Drive
  let fileId = null;
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]{15,})/,   // .../file/d/ID/view
    /[?&]id=([a-zA-Z0-9_-]{15,})/,       // ...?id=ID
    /\/d\/([a-zA-Z0-9_-]{15,})/,          // .../d/ID/...
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) { fileId = m[1]; break; }
  }

  if (fileId) {
    // URL ini berfungsi untuk file "Anyone with link can view"
    return `https://lh3.googleusercontent.com/d/${fileId}=w1200`;
  }

  // Bukan link Google Drive — kembalikan apa adanya
  return url;
}