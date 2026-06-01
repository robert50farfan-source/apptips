const express = require('express');
const fs      = require('fs');
const path    = require('path');

const app       = express();
const PORT      = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

// --- Middleware ---
app.use(express.json({ limit: '2mb' }));
app.use(express.static(__dirname));   // sirve index.html, admin.html, css, js…

// --- Helpers de acceso al archivo ---
function readData() {
  if (!fs.existsSync(DATA_FILE)) return { tips: [], subjects: [] };
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return { tips: [], subjects: [] };
  }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// --- API ---

// Leer todos los datos
app.get('/api/data', (req, res) => {
  res.json(readData());
});

// Guardar todos los datos (reemplaza el archivo completo)
app.post('/api/data', (req, res) => {
  const { tips, subjects } = req.body;
  if (!Array.isArray(tips) || !Array.isArray(subjects)) {
    return res.status(400).json({ error: 'Formato inválido: se esperan arrays tips y subjects.' });
  }
  try {
    writeData({ tips, subjects });
    res.json({ ok: true });
  } catch (e) {
    console.error('Error escribiendo data.json:', e);
    res.status(500).json({ error: 'No se pudo guardar el archivo.' });
  }
});

// Fallback: cualquier ruta desconocida sirve index.html (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// --- Arranque ---
app.listen(PORT, () => {
  console.log('');
  console.log('  🧬  AITips Hub');
  console.log(`  →   http://localhost:${PORT}`);
  console.log(`  →   http://localhost:${PORT}/admin.html  (panel admin)`);
  console.log('');
});
