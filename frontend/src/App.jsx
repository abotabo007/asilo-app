// src/App.jsx
import { useState, useEffect } from "react";
import StudenteCard from "./components/StudenteCard";
import ModaleAggiungiStudente from "./components/ModaleAggiungiStudente";
import ModalePresenza from "./components/ModalePresenza";
import ModaleStorico from "./components/ModaleStorico";
import ModaleNote from "./components/ModaleNote";
import ModaleModificaStudente from "./components/ModaleModificaStudente";
import "./App.css";

const API = "http://localhost:3001/api";

export default function App() {
  const [studenti,       setStudenti]       = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [errore,         setErrore]         = useState(null);

  const [modaleAggiungi, setModaleAggiungi] = useState(false);
  const [modalePresenza, setModalePresenza] = useState(null);
  const [modaleStorico,  setModaleStorico]  = useState(null);
  const [modaleNote,     setModaleNote]     = useState(null);
  const [modaleModifica, setModaleModifica] = useState(null);

  const caricaStudenti = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/studenti`);
      if (!res.ok) throw new Error();
      setStudenti(await res.json());
    } catch {
      setErrore("Impossibile connettersi al server. Assicurati che il backend sia avviato.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { caricaStudenti(); }, []);

  const aggiungiStudente = async (dati) => {
    const res = await fetch(`${API}/studenti`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dati),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.errore); }
    await caricaStudenti();
    setModaleAggiungi(false);
  };

  const eliminaStudente = async (id) => {
    if (!confirm("Sei sicuro di voler eliminare questo studente?")) return;
    await fetch(`${API}/studenti/${id}`, { method: "DELETE" });
    await caricaStudenti();
  };

  const aggiungiOre = async (id, ore) => {
    const res = await fetch(`${API}/studenti/${id}/ore`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ore: parseFloat(ore) }),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.errore); }
    await caricaStudenti();
  };

  const modificaStudente = async (id, dati) => {
    const res = await fetch(`${API}/studenti/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dati),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.errore); }
    await caricaStudenti();
  };

  const salvaNote = async (id, note) => {
    const res = await fetch(`${API}/studenti/${id}/note`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ note }),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.errore); }
    await caricaStudenti();
  };

  const registraIngresso = async (studente_id, orarioPersonalizzato = null) => {
    const res = await fetch(`${API}/presenze/ingresso`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studente_id, orario_personalizzato: orarioPersonalizzato }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.errore);
    await caricaStudenti();
    return data;
  };

  const registraUscita = async (studente_id, orarioPersonalizzato = null) => {
    const res = await fetch(`${API}/presenze/uscita`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studente_id, orario_personalizzato: orarioPersonalizzato }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.errore);
    await caricaStudenti();
    return data;
  };

  return (
    <div className="app">
      {/* HEADER */}
      <header className="header">
        <div className="header-inner">
          <div className="header-logo">
            <div className="logo-badge">🏫</div>
            <div className="logo-text">
              <h1>Gestione Baby Parking</h1>
              <p>Sistema presenze e studenti</p>
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => setModaleAggiungi(true)}>
            + Nuovo Studente
          </button>
        </div>
      </header>

      <main className="main">
        {/* STATS */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon green">👶</div>
            <div className="stat-body">
              <span className="stat-num">{studenti.length}</span>
              <span className="stat-label">Totale studenti</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon sky">📅</div>
            <div className="stat-body">
              <span className="stat-num">{studenti.filter(s => s.tipo_pagamento === "abbonamento").length}</span>
              <span className="stat-label">Abbonamento</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon amber">⏱</div>
            <div className="stat-body">
              <span className="stat-num">{studenti.filter(s => s.tipo_pagamento === "ore").length}</span>
              <span className="stat-label">A ore</span>
            </div>
          </div>
        </div>

        {/* STUDENTI */}
        <div className="section-header">
          <h2 className="section-title">Studenti iscritti</h2>
        </div>

        {loading && (
          <div className="loading">
            <div className="loading-spinner"></div>
            Caricamento studenti...
          </div>
        )}

        {errore && <div className="alert alert-error">⚠️ {errore}</div>}

        {!loading && !errore && (
          <div className="studenti-grid">
            {studenti.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👶</div>
                <h3>Nessuno studente registrato</h3>
                <p>Aggiungi il primo studente per iniziare</p>
                <button className="btn btn-primary-teal" onClick={() => setModaleAggiungi(true)}>
                  + Aggiungi il primo studente
                </button>
              </div>
            ) : (
              studenti.map(s => (
                <StudenteCard
                  key={s.id}
                  studente={s}
                  onElimina={() => eliminaStudente(s.id)}
                  onPresenza={() => setModalePresenza(s)}
                  onStorico={() => setModaleStorico(s)}
                  onAggiungiOre={(ore) => aggiungiOre(s.id, ore)}
                  onModifica={() => setModaleModifica(s)}
                  onNote={() => setModaleNote(s)}
                />
              ))
            )}
          </div>
        )}
      </main>

      {/* MODALI */}
      {modaleAggiungi && (
        <ModaleAggiungiStudente onClose={() => setModaleAggiungi(false)} onSalva={aggiungiStudente} />
      )}
      {modalePresenza && (
        <ModalePresenza
          studente={modalePresenza} onClose={() => setModalePresenza(null)}
          onIngresso={registraIngresso} onUscita={registraUscita}
        />
      )}
      {modaleStorico && (
        <ModaleStorico studente={modaleStorico} onClose={() => setModaleStorico(null)} api={API} />
      )}
      {modaleNote && (
        <ModaleNote
          studente={modaleNote} onClose={() => setModaleNote(null)}
          onSalva={(note) => salvaNote(modaleNote.id, note)}
        />
      )}
      {modaleModifica && (
        <ModaleModificaStudente
          studente={modaleModifica} onClose={() => setModaleModifica(null)} onSalva={modificaStudente}
        />
      )}
    </div>
  );
}
