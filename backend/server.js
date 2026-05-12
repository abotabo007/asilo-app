// ============================================================
// server.js - Backend Gestione Asilo (PostgreSQL)
// ============================================================
const express = require("express");
const cors    = require("cors");
const { Pool } = require("pg");

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || "*"
}));
app.use(express.json());

// Connessione PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

pool.connect((err, client, release) => {
  if (err) console.error("Errore connessione DB:", err.message);
  else { console.log("Connesso a PostgreSQL"); release(); }
});

// Inizializzazione tabelle
async function inizializzaDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS studenti (
      id             SERIAL PRIMARY KEY,
      nome           TEXT    NOT NULL,
      cognome        TEXT    NOT NULL,
      tipo_pagamento TEXT    NOT NULL CHECK(tipo_pagamento IN ('abbonamento','ore')),
      ore_residue    NUMERIC(8,2) DEFAULT 0,
      note           TEXT    DEFAULT '',
      created_at     TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS presenze (
      id            SERIAL PRIMARY KEY,
      studente_id   INTEGER NOT NULL REFERENCES studenti(id) ON DELETE CASCADE,
      ingresso      TIMESTAMP NOT NULL,
      uscita        TIMESTAMP,
      ore_consumate NUMERIC(8,2),
      created_at    TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log("Tabelle pronte");
}
inizializzaDB().catch(err => console.error("Errore inizializzazione DB:", err));

// ── GET /api/studenti
app.get("/api/studenti", async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT s.*,
        (SELECT COUNT(*) FROM presenze p WHERE p.studente_id = s.id)::int AS totale_presenze
      FROM studenti s ORDER BY s.cognome, s.nome
    `);
    res.json(r.rows);
  } catch (err) { console.error(err); res.status(500).json({ errore: "Errore nel recupero degli studenti" }); }
});

// ── POST /api/studenti
app.post("/api/studenti", async (req, res) => {
  const { nome, cognome, tipo_pagamento, ore_iniziali } = req.body;
  if (!nome || !cognome || !tipo_pagamento)
    return res.status(400).json({ errore: "Nome, cognome e tipo pagamento sono obbligatori" });
  if (!["abbonamento","ore"].includes(tipo_pagamento))
    return res.status(400).json({ errore: "Tipo pagamento non valido" });
  try {
    const ore = tipo_pagamento === "ore" ? (parseFloat(ore_iniziali) || 0) : 0;
    const r = await pool.query(
      "INSERT INTO studenti (nome,cognome,tipo_pagamento,ore_residue) VALUES ($1,$2,$3,$4) RETURNING *",
      [nome.trim(), cognome.trim(), tipo_pagamento, ore]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ errore: "Errore nella creazione dello studente" }); }
});

// ── DELETE /api/studenti/:id
app.delete("/api/studenti/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const check = await pool.query("SELECT id FROM studenti WHERE id=$1", [id]);
    if (!check.rows.length) return res.status(404).json({ errore: "Studente non trovato" });
    await pool.query("DELETE FROM studenti WHERE id=$1", [id]);
    res.json({ messaggio: "Studente eliminato" });
  } catch (err) { console.error(err); res.status(500).json({ errore: "Errore nell'eliminazione" }); }
});

// ── PUT /api/studenti/:id (modifica tipo pagamento)
app.put("/api/studenti/:id", async (req, res) => {
  const { id } = req.params;
  const { tipo_pagamento, ore_iniziali } = req.body;
  if (!["abbonamento","ore"].includes(tipo_pagamento))
    return res.status(400).json({ errore: "Tipo pagamento non valido" });
  try {
    const check = await pool.query("SELECT * FROM studenti WHERE id=$1", [id]);
    if (!check.rows.length) return res.status(404).json({ errore: "Studente non trovato" });
    const s = check.rows[0];
    let nuoveOre = parseFloat(s.ore_residue);
    if (tipo_pagamento === "abbonamento") nuoveOre = 0;
    else if (s.tipo_pagamento === "abbonamento") nuoveOre = parseFloat(ore_iniziali) || 0;
    const r = await pool.query(
      "UPDATE studenti SET tipo_pagamento=$1, ore_residue=$2 WHERE id=$3 RETURNING *",
      [tipo_pagamento, nuoveOre, id]
    );
    res.json(r.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ errore: "Errore nella modifica" }); }
});

// ── POST /api/studenti/:id/ore
app.post("/api/studenti/:id/ore", async (req, res) => {
  const { id } = req.params;
  const { ore } = req.body;
  if (!ore || ore <= 0) return res.status(400).json({ errore: "Inserire un numero di ore valido (> 0)" });
  try {
    const check = await pool.query("SELECT * FROM studenti WHERE id=$1", [id]);
    if (!check.rows.length) return res.status(404).json({ errore: "Studente non trovato" });
    if (check.rows[0].tipo_pagamento !== "ore")
      return res.status(400).json({ errore: "Solo studenti a ore possono avere credito ore" });
    const r = await pool.query(
      "UPDATE studenti SET ore_residue = ore_residue + $1 WHERE id=$2 RETURNING *",
      [ore, id]
    );
    res.json(r.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ errore: "Errore nell'aggiunta delle ore" }); }
});

// ── PUT /api/studenti/:id/note
app.put("/api/studenti/:id/note", async (req, res) => {
  const { id } = req.params;
  const { note } = req.body;
  if (note === undefined || note === null) return res.status(400).json({ errore: "Campo note mancante" });
  try {
    const check = await pool.query("SELECT id FROM studenti WHERE id=$1", [id]);
    if (!check.rows.length) return res.status(404).json({ errore: "Studente non trovato" });
    const r = await pool.query("UPDATE studenti SET note=$1 WHERE id=$2 RETURNING *", [note, id]);
    res.json(r.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ errore: "Errore nel salvataggio delle note" }); }
});

// ── GET /api/presenze/:studente_id
app.get("/api/presenze/:studente_id", async (req, res) => {
  const { studente_id } = req.params;
  try {
    const r = await pool.query(
      "SELECT * FROM presenze WHERE studente_id=$1 ORDER BY ingresso DESC LIMIT 50",
      [studente_id]
    );
    res.json(r.rows);
  } catch (err) { console.error(err); res.status(500).json({ errore: "Errore nel recupero delle presenze" }); }
});

// ── POST /api/presenze/ingresso
app.post("/api/presenze/ingresso", async (req, res) => {
  const { studente_id, orario_personalizzato } = req.body;
  if (!studente_id) return res.status(400).json({ errore: "ID studente obbligatorio" });
  try {
    const sCheck = await pool.query("SELECT * FROM studenti WHERE id=$1", [studente_id]);
    if (!sCheck.rows.length) return res.status(404).json({ errore: "Studente non trovato" });
    const aperta = await pool.query(
      "SELECT id FROM presenze WHERE studente_id=$1 AND uscita IS NULL", [studente_id]
    );
    if (aperta.rows.length)
      return res.status(400).json({ errore: "Lo studente ha già un ingresso registrato. Registrare prima l'uscita." });
    const ora = orario_personalizzato ? new Date(orario_personalizzato) : new Date();
    if (isNaN(ora.getTime())) return res.status(400).json({ errore: "Orario non valido" });
    const r = await pool.query(
      "INSERT INTO presenze (studente_id, ingresso) VALUES ($1,$2) RETURNING *",
      [studente_id, ora]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ errore: "Errore nella registrazione dell'ingresso" }); }
});

// ── POST /api/presenze/uscita
app.post("/api/presenze/uscita", async (req, res) => {
  const { studente_id, orario_personalizzato } = req.body;
  if (!studente_id) return res.status(400).json({ errore: "ID studente obbligatorio" });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const sCheck = await client.query("SELECT * FROM studenti WHERE id=$1", [studente_id]);
    if (!sCheck.rows.length) { await client.query("ROLLBACK"); return res.status(404).json({ errore: "Studente non trovato" }); }
    const studente = sCheck.rows[0];
    const apertaRes = await client.query(
      "SELECT * FROM presenze WHERE studente_id=$1 AND uscita IS NULL", [studente_id]
    );
    if (!apertaRes.rows.length) { await client.query("ROLLBACK"); return res.status(400).json({ errore: "Nessun ingresso registrato per questo studente." }); }
    const aperta = apertaRes.rows[0];
    const ora = orario_personalizzato ? new Date(orario_personalizzato) : new Date();
    if (isNaN(ora.getTime())) { await client.query("ROLLBACK"); return res.status(400).json({ errore: "Orario non valido" }); }
    if (ora <= new Date(aperta.ingresso)) { await client.query("ROLLBACK"); return res.status(400).json({ errore: "L'orario di uscita deve essere successivo all'ingresso." }); }
    const oreConsumate = Math.round(((ora - new Date(aperta.ingresso)) / 3600000) * 100) / 100;
    const presenzaRes = await client.query(
      "UPDATE presenze SET uscita=$1, ore_consumate=$2 WHERE id=$3 RETURNING *",
      [ora, oreConsumate, aperta.id]
    );
    let studenteAggiornato = studente;
    if (studente.tipo_pagamento === "ore") {
      const nuoveOre = Math.max(0, parseFloat(studente.ore_residue) - oreConsumate);
      const sRes = await client.query(
        "UPDATE studenti SET ore_residue=$1 WHERE id=$2 RETURNING *",
        [Math.round(nuoveOre * 100) / 100, studente_id]
      );
      studenteAggiornato = sRes.rows[0];
    }
    await client.query("COMMIT");
    res.json({ presenza: presenzaRes.rows[0], studente: studenteAggiornato });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ errore: "Errore nella registrazione dell'uscita" });
  } finally { client.release(); }
});

// ── AVVIO
app.listen(PORT, () => {
  console.log(`Server avviato su http://localhost:${PORT}`);
});
