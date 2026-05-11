// ============================================================
// server.js - Backend Gestione Asilo (versione finale)
// ============================================================
const express  = require("express");
const cors     = require("cors");
const Database = require("better-sqlite3");
const path     = require("path");

const app  = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const db = new Database(path.join(__dirname, "asilo.db"));
db.pragma("foreign_keys = ON");

// ============================================================
// SCHEMA
// ============================================================
db.exec(`
  CREATE TABLE IF NOT EXISTS studenti (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    nome           TEXT    NOT NULL,
    cognome        TEXT    NOT NULL,
    tipo_pagamento TEXT    NOT NULL CHECK(tipo_pagamento IN ('abbonamento','ore')),
    ore_residue    REAL    DEFAULT 0,
    note           TEXT    DEFAULT '',
    created_at     TEXT    DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS presenze (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    studente_id   INTEGER NOT NULL,
    ingresso      TEXT    NOT NULL,
    uscita        TEXT,
    ore_consumate REAL,
    created_at    TEXT    DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (studente_id) REFERENCES studenti(id) ON DELETE CASCADE
  );
`);

// Migrazione sicura: aggiunge colonna note se il DB esiste già senza di essa
try { db.exec("ALTER TABLE studenti ADD COLUMN note TEXT DEFAULT ''"); }
catch (_) { /* già presente */ }

// ============================================================
// STUDENTI
// ============================================================

app.get("/api/studenti", (req, res) => {
  try {
    const studenti = db.prepare(`
      SELECT s.*,
        (SELECT COUNT(*) FROM presenze p WHERE p.studente_id = s.id) AS totale_presenze
      FROM studenti s ORDER BY s.cognome, s.nome
    `).all();
    res.json(studenti);
  } catch { res.status(500).json({ errore: "Errore nel recupero degli studenti" }); }
});

app.post("/api/studenti", (req, res) => {
  const { nome, cognome, tipo_pagamento, ore_iniziali } = req.body;
  if (!nome || !cognome || !tipo_pagamento)
    return res.status(400).json({ errore: "Nome, cognome e tipo pagamento sono obbligatori" });
  if (!["abbonamento","ore"].includes(tipo_pagamento))
    return res.status(400).json({ errore: "Tipo pagamento non valido" });
  try {
    const ore = tipo_pagamento === "ore" ? (parseFloat(ore_iniziali) || 0) : 0;
    const r = db.prepare("INSERT INTO studenti (nome,cognome,tipo_pagamento,ore_residue) VALUES (?,?,?,?)")
      .run(nome.trim(), cognome.trim(), tipo_pagamento, ore);
    res.status(201).json(db.prepare("SELECT * FROM studenti WHERE id=?").get(r.lastInsertRowid));
  } catch { res.status(500).json({ errore: "Errore nella creazione dello studente" }); }
});

app.delete("/api/studenti/:id", (req, res) => {
  const { id } = req.params;
  try {
    if (!db.prepare("SELECT id FROM studenti WHERE id=?").get(id))
      return res.status(404).json({ errore: "Studente non trovato" });
    db.prepare("DELETE FROM studenti WHERE id=?").run(id);
    res.json({ messaggio: "Studente eliminato" });
  } catch { res.status(500).json({ errore: "Errore nell'eliminazione" }); }
});

app.put("/api/studenti/:id", (req, res) => {
  const { id } = req.params;
  const { tipo_pagamento, ore_iniziali } = req.body;
  if (!["abbonamento","ore"].includes(tipo_pagamento))
    return res.status(400).json({ errore: "Tipo pagamento non valido" });
  try {
    const s = db.prepare("SELECT * FROM studenti WHERE id=?").get(id);
    if (!s) return res.status(404).json({ errore: "Studente non trovato" });
    const nuoveOre = tipo_pagamento === "abbonamento" ? 0
      : s.tipo_pagamento === "abbonamento" ? (parseFloat(ore_iniziali) || 0)
      : s.ore_residue;
    db.prepare("UPDATE studenti SET tipo_pagamento=?, ore_residue=? WHERE id=?").run(tipo_pagamento, nuoveOre, id);
    res.json(db.prepare("SELECT * FROM studenti WHERE id=?").get(id));
  } catch { res.status(500).json({ errore: "Errore nella modifica" }); }
});

app.post("/api/studenti/:id/ore", (req, res) => {
  const { id } = req.params;
  const { ore } = req.body;
  if (!ore || ore <= 0)
    return res.status(400).json({ errore: "Inserire un numero di ore valido (> 0)" });
  try {
    const s = db.prepare("SELECT * FROM studenti WHERE id=?").get(id);
    if (!s) return res.status(404).json({ errore: "Studente non trovato" });
    if (s.tipo_pagamento !== "ore")
      return res.status(400).json({ errore: "Solo studenti a ore possono avere credito ore" });
    db.prepare("UPDATE studenti SET ore_residue = ore_residue + ? WHERE id=?").run(ore, id);
    res.json(db.prepare("SELECT * FROM studenti WHERE id=?").get(id));
  } catch { res.status(500).json({ errore: "Errore nell'aggiunta delle ore" }); }
});

// PUT /api/studenti/:id/note — salva le note di uno studente
app.put("/api/studenti/:id/note", (req, res) => {
  const { id } = req.params;
  const { note } = req.body;
  if (note === undefined || note === null)
    return res.status(400).json({ errore: "Campo note mancante" });
  try {
    const s = db.prepare("SELECT * FROM studenti WHERE id=?").get(id);
    if (!s) return res.status(404).json({ errore: "Studente non trovato" });
    db.prepare("UPDATE studenti SET note=? WHERE id=?").run(note, id);
    res.json(db.prepare("SELECT * FROM studenti WHERE id=?").get(id));
  } catch { res.status(500).json({ errore: "Errore nel salvataggio delle note" }); }
});

// ============================================================
// PRESENZE
// ============================================================

app.get("/api/presenze/:studente_id", (req, res) => {
  const { studente_id } = req.params;
  try {
    res.json(db.prepare(
      "SELECT * FROM presenze WHERE studente_id=? ORDER BY ingresso DESC LIMIT 50"
    ).all(studente_id));
  } catch { res.status(500).json({ errore: "Errore nel recupero delle presenze" }); }
});

app.post("/api/presenze/ingresso", (req, res) => {
  const { studente_id, orario_personalizzato } = req.body;
  if (!studente_id)
    return res.status(400).json({ errore: "ID studente obbligatorio" });
  try {
    const s = db.prepare("SELECT * FROM studenti WHERE id=?").get(studente_id);
    if (!s) return res.status(404).json({ errore: "Studente non trovato" });
    if (db.prepare("SELECT id FROM presenze WHERE studente_id=? AND uscita IS NULL").get(studente_id))
      return res.status(400).json({ errore: "Lo studente ha già un ingresso registrato. Registrare prima l'uscita." });
    const ora = orario_personalizzato ? new Date(orario_personalizzato).toISOString() : new Date().toISOString();
    if (isNaN(new Date(ora).getTime()))
      return res.status(400).json({ errore: "Orario non valido" });
    const r = db.prepare("INSERT INTO presenze (studente_id, ingresso) VALUES (?,?)").run(studente_id, ora);
    res.status(201).json(db.prepare("SELECT * FROM presenze WHERE id=?").get(r.lastInsertRowid));
  } catch { res.status(500).json({ errore: "Errore nella registrazione dell'ingresso" }); }
});

app.post("/api/presenze/uscita", (req, res) => {
  const { studente_id, orario_personalizzato } = req.body;
  if (!studente_id)
    return res.status(400).json({ errore: "ID studente obbligatorio" });
  try {
    const s = db.prepare("SELECT * FROM studenti WHERE id=?").get(studente_id);
    if (!s) return res.status(404).json({ errore: "Studente non trovato" });
    const aperta = db.prepare("SELECT * FROM presenze WHERE studente_id=? AND uscita IS NULL").get(studente_id);
    if (!aperta)
      return res.status(400).json({ errore: "Nessun ingresso registrato per questo studente." });
    const ora = orario_personalizzato ? new Date(orario_personalizzato).toISOString() : new Date().toISOString();
    if (isNaN(new Date(ora).getTime()))
      return res.status(400).json({ errore: "Orario non valido" });
    if (new Date(ora) <= new Date(aperta.ingresso))
      return res.status(400).json({ errore: "L'orario di uscita deve essere successivo all'ingresso." });
    const oreConsumate = Math.round(((new Date(ora) - new Date(aperta.ingresso)) / 3600000) * 100) / 100;
    db.transaction(() => {
      db.prepare("UPDATE presenze SET uscita=?, ore_consumate=? WHERE id=?").run(ora, oreConsumate, aperta.id);
      if (s.tipo_pagamento === "ore")
        db.prepare("UPDATE studenti SET ore_residue=? WHERE id=?")
          .run(Math.round(Math.max(0, s.ore_residue - oreConsumate) * 100) / 100, studente_id);
    })();
    res.json({
      presenza: db.prepare("SELECT * FROM presenze WHERE id=?").get(aperta.id),
      studente: db.prepare("SELECT * FROM studenti WHERE id=?").get(studente_id),
    });
  } catch { res.status(500).json({ errore: "Errore nella registrazione dell'uscita" }); }
});

// ============================================================
app.listen(PORT, () => {
  console.log(`✅ Server avviato su http://localhost:${PORT}`);
  console.log(`📁 Database: asilo.db`);
});
