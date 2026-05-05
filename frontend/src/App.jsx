// src/App.jsx - Componente principale
import { useState, useEffect } from "react";
import StudenteCard from "./components/StudenteCard";
import ModaleAggiungiStudente from "./components/ModaleAggiungiStudente";
import ModalePresenza from "./components/ModalePresenza";
import ModaleStorico from "./components/ModaleStorico";
import ModaleModificaStudente from "./components/ModaleModificaStudente";
import "./App.css";

const API = "http://localhost:3001/api";

export default function App() {
  const [studenti, setStudenti] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errore, setErrore] = useState(null);
  const [modaleModifica, setModaleModifica] = useState(null);

  // Stato modali
  const [modaleAggiungi, setModaleAggiungi] = useState(false);
  const [modalePresenza, setModalePresenza] = useState(null); // studente selezionato
  const [modaleStorico, setModaleStorico] = useState(null); // studente selezionato

  // Carica studenti dal backend
  const caricaStudenti = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/studenti`);
      if (!res.ok) throw new Error("Errore nel caricamento");
      const data = await res.json();
      setStudenti(data);
    } catch (e) {
      setErrore("Impossibile connettersi al server. Assicurati che il backend sia avviato.");
    } finally {
      setLoading(false);
    }
  };
  
  const modificaStudente = async (id, dati) => {
    const res = await fetch(`${API}/studenti/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dati),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.errore);
    }
    await caricaStudenti();
  };

    
  useEffect(() => {
    caricaStudenti();
  }, []);

  // Aggiunge uno studente
  const aggiungiStudente = async (dati) => {
    const res = await fetch(`${API}/studenti`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dati),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.errore);
    }
    await caricaStudenti();
    setModaleAggiungi(false);
  };

  // Elimina uno studente
  const eliminaStudente = async (id) => {
    if (!confirm("Sei sicuro di voler eliminare questo studente?")) return;
    const res = await fetch(`${API}/studenti/${id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Errore nell'eliminazione dello studente");
      return;
    }
    await caricaStudenti();
  };

  // Aggiunge ore a uno studente
  const aggiungiOre = async (id, ore) => {
    const res = await fetch(`${API}/studenti/${id}/ore`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ore: parseFloat(ore) }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.errore);
    }
    await caricaStudenti();
  };

 // Registra ingresso
  const registraIngresso = async (studente_id) => {
    const res = await fetch(`${API}/presenze/ingresso`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studente_id }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.errore);
    await caricaStudenti();
    return data;
  };

  // Registra uscita
  const registraUscita = async (studente_id) => {
    const res = await fetch(`${API}/presenze/uscita`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studente_id }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.errore);
    await caricaStudenti();
    return data;
  };

  // Contatori sommario
  const totaleStudenti = studenti.length;
  const presentiOggi = studenti.filter((s) => s.totale_presenze > 0).length;

  return (
    <div className="app">
      {/* HEADER */}
      <header className="header">
        <div className="header-inner">
          <div className="header-logo">
            <span className="logo-icon">🏫</span>
            <div>
              <h1>Gestione Asilo</h1>
              <p>Sistema presenze e studenti</p>
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => setModaleAggiungi(true)}>
            + Aggiungi Studente
          </button>
        </div>
      </header>

      <main className="main">
        {/* STATS */}
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-num">{totaleStudenti}</span>
            <span className="stat-label">Studenti totali</span>
          </div>
          <div className="stat-card">
            <span className="stat-num">
              {studenti.filter((s) => s.tipo_pagamento === "abbonamento").length}
            </span>
            <span className="stat-label">Abbonamento</span>
          </div>
          <div className="stat-card">
            <span className="stat-num">
              {studenti.filter((s) => s.tipo_pagamento === "ore").length}
            </span>
            <span className="stat-label">A ore</span>
          </div>
        </div>

        {/* LISTA STUDENTI */}
        <section className="studenti-section">
          <h2 className="section-title">Studenti</h2>

          {loading && <div className="loading">Caricamento...</div>}

          {errore && (
            <div className="alert alert-error">
              ⚠️ {errore}
            </div>
          )}

          {!loading && !errore && studenti.length === 0 && (
            <div className="empty-state">
              <span>👶</span>
              <p>Nessuno studente registrato.</p>
              <button className="btn btn-primary" onClick={() => setModaleAggiungi(true)}>
                Aggiungi il primo studente
              </button>
            </div>
          )}

          <div className="studenti-grid">
            {studenti.map((s) => (
              <StudenteCard
                key={s.id}
                studente={s}
                onElimina={() => eliminaStudente(s.id)}
                onPresenza={() => setModalePresenza(s)}
                onStorico={() => setModaleStorico(s)}
                onAggiungiOre={(ore) => aggiungiOre(s.id, ore)}
                onModifica={() => setModaleModifica(s)}
              />
            ))}
          </div>
        </section>
      </main>

      {/* MODALI */}
      {modaleAggiungi && (
        <ModaleAggiungiStudente
          onClose={() => setModaleAggiungi(false)}
          onSalva={aggiungiStudente}
        />
      )}

      {modalePresenza && (
        <ModalePresenza
          studente={modalePresenza}
          onClose={() => setModalePresenza(null)}
          onIngresso={registraIngresso}
          onUscita={registraUscita}
        />
      )}

      {modaleModifica && (
        <ModaleModificaStudente
          studente={modaleModifica}
          onClose={() => setModaleModifica(null)}
          onSalva={modificaStudente}
        />
      )}

      {modaleStorico && (
        <ModaleStorico
          studente={modaleStorico}
          onClose={() => setModaleStorico(null)}
          api={API}
        />
      )}
    </div>
  );
}
