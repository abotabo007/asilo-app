// ============================================================
// server.js - Backend principale dell'app Asilo
// ============================================================
const express = require("express");
const cors = require("cors");
const Database = require("better-sqlite3");
const path = require("path");

const app = express();
const PORT = 3001;

// --- Middleware ---
app.use(cors()); // Permette richieste dal frontend React
app.use(express.json()); // Parsing JSON nelle richieste

// --- Connessione al database SQLite ---
const db = new Database(path.join(__dirname, "asilo.db"));

// ============================================================
// INIZIALIZZAZIONE DATABASE
// Crea le tabelle se non esistono già
// ============================================================
db.exec(`
  CREATE TABLE IF NOT EXISTS studenti (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    cognome TEXT NOT NULL,
    tipo_pagamento TEXT NOT NULL CHECK(tipo_pagamento IN ('abbonamento', 'ore')),
    ore_residue REAL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS presenze (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    studente_id INTEGER NOT NULL,
    ingresso TEXT NOT NULL,
    uscita TEXT,
    ore_consumate REAL,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (studente_id) REFERENCES studenti(id) ON DELETE CASCADE
  );
`);

// ============================================================
// ROUTES - STUDENTI
// ============================================================

// GET /api/studenti - Recupera tutti gli studenti
app.get("/api/studenti", (req, res) => {
  try {
    const studenti = db
      .prepare(
        `
      SELECT s.*, 
        (SELECT COUNT(*) FROM presenze p WHERE p.studente_id = s.id) as totale_presenze
      FROM studenti s
      ORDER BY s.cognome, s.nome
    `
      )
      .all();
    res.json(studenti);
  } catch (err) {
    res.status(500).json({ errore: "Errore nel recupero degli studenti" });
  }
});

// POST /api/studenti - Aggiunge un nuovo studente
app.post("/api/studenti", (req, res) => {
  const { nome, cognome, tipo_pagamento, ore_iniziali } = req.body;

  // Validazione campi obbligatori
  if (!nome || !cognome || !tipo_pagamento) {
    return res
      .status(400)
      .json({ errore: "Nome, cognome e tipo pagamento sono obbligatori" });
  }

  if (!["abbonamento", "ore"].includes(tipo_pagamento)) {
    return res.status(400).json({ errore: "Tipo pagamento non valido" });
  }

  try {
    const ore = tipo_pagamento === "ore" ? ore_iniziali || 0 : 0;
    const stmt = db.prepare(
      "INSERT INTO studenti (nome, cognome, tipo_pagamento, ore_residue) VALUES (?, ?, ?, ?)"
    );
    const result = stmt.run(nome.trim(), cognome.trim(), tipo_pagamento, ore);

    const nuovoStudente = db
      .prepare("SELECT * FROM studenti WHERE id = ?")
      .get(result.lastInsertRowid);
    res.status(201).json(nuovoStudente);
  } catch (err) {
    res.status(500).json({ errore: "Errore nella creazione dello studente" });
  }
});

// DELETE /api/studenti/:id - Elimina uno studente
app.delete("/api/studenti/:id", (req, res) => {
  const { id } = req.params;
  try {
    const studente = db
      .prepare("SELECT * FROM studenti WHERE id = ?")
      .get(id);
    if (!studente) {
      return res.status(404).json({ errore: "Studente non trovato" });
    }
    db.prepare("DELETE FROM studenti WHERE id = ?").run(id);
    res.json({ messaggio: "Studente eliminato con successo" });
  } catch (err) {
    res.status(500).json({ errore: "Errore nell'eliminazione dello studente" });
  }
});

// POST /api/studenti/:id/ore - Aggiunge ore a uno studente "ore"
app.post("/api/studenti/:id/ore", (req, res) => {
  const { id } = req.params;
  const { ore } = req.body;

  if (!ore || ore <= 0) {
    return res
      .status(400)
      .json({ errore: "Inserire un numero di ore valido (> 0)" });
  }

  try {
    const studente = db
      .prepare("SELECT * FROM studenti WHERE id = ?")
      .get(id);
    if (!studente) {
      return res.status(404).json({ errore: "Studente non trovato" });
    }
    if (studente.tipo_pagamento !== "ore") {
      return res
        .status(400)
        .json({ errore: "Solo gli studenti a ore possono avere credito ore" });
    }

    db.prepare(
      "UPDATE studenti SET ore_residue = ore_residue + ? WHERE id = ?"
    ).run(ore, id);
    const aggiornato = db
      .prepare("SELECT * FROM studenti WHERE id = ?")
      .get(id);
    res.json(aggiornato);
  } catch (err) {
    res.status(500).json({ errore: "Errore nell'aggiunta delle ore" });
  }
});

// ============================================================
// ROUTES - PRESENZE
// ============================================================

// GET /api/presenze/:studente_id - Storico presenze di uno studente
app.get("/api/presenze/:studente_id", (req, res) => {
  const { studente_id } = req.params;
  try {
    const presenze = db
      .prepare(
        `
      SELECT * FROM presenze 
      WHERE studente_id = ? 
      ORDER BY ingresso DESC
      LIMIT 50
    `
      )
      .all(studente_id);
    res.json(presenze);
  } catch (err) {
    res.status(500).json({ errore: "Errore nel recupero delle presenze" });
  }
});

// POST /api/presenze/ingresso - Registra ingresso
app.post("/api/presenze/ingresso", (req, res) => {
  const { studente_id } = req.body;

  if (!studente_id) {
    return res.status(400).json({ errore: "ID studente obbligatorio" });
  }

  try {
    const studente = db
      .prepare("SELECT * FROM studenti WHERE id = ?")
      .get(studente_id);
    if (!studente) {
      return res.status(404).json({ errore: "Studente non trovato" });
    }

    // Controlla se c'è già un ingresso aperto (senza uscita)
    const presenzaAperta = db
      .prepare(
        "SELECT * FROM presenze WHERE studente_id = ? AND uscita IS NULL"
      )
      .get(studente_id);

    if (presenzaAperta) {
      return res.status(400).json({
        errore:
          "Lo studente ha già un ingresso registrato. Registrare prima l'uscita.",
      });
    }

    const ora = new Date().toISOString();
    const result = db
      .prepare(
        "INSERT INTO presenze (studente_id, ingresso) VALUES (?, ?)"
      )
      .run(studente_id, ora);

    const nuovaPresenza = db
      .prepare("SELECT * FROM presenze WHERE id = ?")
      .get(result.lastInsertRowid);
    res.status(201).json(nuovaPresenza);
  } catch (err) {
    res.status(500).json({ errore: "Errore nella registrazione dell'ingresso" });
  }
});

// POST /api/presenze/uscita - Registra uscita e calcola ore
app.post("/api/presenze/uscita", (req, res) => {
  const { studente_id } = req.body;

  if (!studente_id) {
    return res.status(400).json({ errore: "ID studente obbligatorio" });
  }

  try {
    const studente = db
      .prepare("SELECT * FROM studenti WHERE id = ?")
      .get(studente_id);
    if (!studente) {
      return res.status(404).json({ errore: "Studente non trovato" });
    }

    // Trova la presenza aperta (senza uscita)
    const presenzaAperta = db
      .prepare(
        "SELECT * FROM presenze WHERE studente_id = ? AND uscita IS NULL"
      )
      .get(studente_id);

    if (!presenzaAperta) {
      return res.status(400).json({
        errore: "Nessun ingresso registrato per questo studente.",
      });
    }

    const ora = new Date().toISOString();
    const ingresso = new Date(presenzaAperta.ingresso);
    const uscita = new Date(ora);

    // Calcola ore consumate con arrotondamento a 2 decimali
    const differenzaMs = uscita - ingresso;
    const oreConsumate = Math.round((differenzaMs / (1000 * 60 * 60)) * 100) / 100;

    // Inizia una transazione: aggiorna presenza e (se "ore") scala il credito
    const aggiornaPresenzaEOre = db.transaction(() => {
      // Aggiorna la presenza con uscita e ore
      db.prepare(
        "UPDATE presenze SET uscita = ?, ore_consumate = ? WHERE id = ?"
      ).run(ora, oreConsumate, presenzaAperta.id);

      // Se studente a ore, scala il credito (senza andare sotto zero)
      if (studente.tipo_pagamento === "ore") {
        const nuoveOre = Math.max(0, studente.ore_residue - oreConsumate);
        db.prepare("UPDATE studenti SET ore_residue = ? WHERE id = ?").run(
          Math.round(nuoveOre * 100) / 100,
          studente_id
        );
      }
    });

    aggiornaPresenzaEOre();

    // Restituisce la presenza aggiornata e lo studente aggiornato
    const presenzaAggiornata = db
      .prepare("SELECT * FROM presenze WHERE id = ?")
      .get(presenzaAperta.id);
    const studenteAggiornato = db
      .prepare("SELECT * FROM studenti WHERE id = ?")
      .get(studente_id);

    res.json({ presenza: presenzaAggiornata, studente: studenteAggiornato });
  } catch (err) {
    res.status(500).json({ errore: "Errore nella registrazione dell'uscita" });
  }
});

// ============================================================
// AVVIO SERVER
// ============================================================
app.listen(PORT, () => {
  console.log(`✅ Server avviato su http://localhost:${PORT}`);
  console.log(`📁 Database: asilo.db`);
});
