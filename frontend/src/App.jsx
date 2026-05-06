// src/App.jsx — Gestione Asilo (redesign)
import { useState, useEffect } from "react";
import StudenteCard from "./components/StudenteCard";
import ModaleAggiungiStudente from "./components/ModaleAggiungiStudente";
import ModalePresenza from "./components/ModalePresenza";
import ModaleStorico from "./components/ModaleStorico";
import "./App.css";

const API = "http://192.168.1.15:3001/api";

export default function App() {
  const [studenti, setStudenti] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errore, setErrore] = useState(null);

  const [modaleAggiungi, setModaleAggiungi] = useState(false);
  const [modalePresenza, setModalePresenza] = useState(null);
  const [modaleStorico, setModaleStorico] = useState(null);
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
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dati),
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
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ore: parseFloat(ore) }),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.errore); }
    await caricaStudenti();
  };

  const modificaStudente = async (id, dati) => {
    const res = await fetch(`${API}/studenti/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dati),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.errore); }
    await caricaStudenti();
  };

  // Registra ingresso — accetta orario opzionale
  const registraIngresso = async (studente_id, orarioPersonalizzato = null) => {
    const res = await fetch(`${API}/presenze/ingresso`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studente_id, orario_personalizzato: orarioPersonalizzato }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.errore);
    await caricaStudenti();
    return data;
  };

  // Registra uscita — accetta orario opzionale
  const registraUscita = async (studente_id, orarioPersonalizzato = null) => {
    const res = await fetch(`${API}/presenze/uscita`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studente_id, orario_personalizzato: orarioPersonalizzato }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.errore);
    await caricaStudenti();
    return data;
  };

  const nAbb = studenti.filter(s => s.tipo_pagamento === "abbonamento").length;
  const nOre = studenti.filter(s => s.tipo_pagamento === "ore").length;

  return (
    <div className="app">
      {/* HEADER */}
      <header className="header">
        <div className="header-inner">
          <div className="header-logo">
            <div className="logo-badge">🏫</div>
            <div className="logo-text">
              <h1>Gestione BabyParking</h1>
              <p>Sistema presenze e studenti</p>
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => setModaleAggiungi(true)}>
            + Nuovo Studente
          </button>
        </div>
      </header>

      <main className="main">
        {/* STATISTICHE */}
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
              <span className="stat-num">{nAbb}</span>
              <span className="stat-label">Abbonamento</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon amber">⏱</div>
            <div className="stat-body">
              <span className="stat-num">{nOre}</span>
              <span className="stat-label">A ore</span>
            </div>
          </div>
        </div>

        {/* LISTA STUDENTI */}
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
                <button className="btn btn-primary" onClick={() => setModaleAggiungi(true)}>
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
                />
              ))
            )}
          </div>
        )}
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
      {modaleStorico && (
        <ModaleStorico
          studente={modaleStorico}
          onClose={() => setModaleStorico(null)}
          api={API}
        />
      )}
      {modaleModifica && (
        <ModaleModificaStudente
          studente={modaleModifica}
          onClose={() => setModaleModifica(null)}
          onSalva={modificaStudente}
        />
      )}
    </div>
  );
}

// Componente ModaleModificaStudente inline per semplicità
function ModaleModificaStudente({ studente, onClose, onSalva }) {
  const [tipo, setTipo] = useState(studente.tipo_pagamento);
  const [oreIniziali, setOreIniziali] = useState("");
  const [errore, setErrore] = useState("");
  const [loading, setLoading] = useState(false);
  const cambioTipo = tipo !== studente.tipo_pagamento;

  const handleSalva = async () => {
    setErrore("");
    if (!cambioTipo) { onClose(); return; }
    try {
      setLoading(true);
      await onSalva(studente.id, { tipo_pagamento: tipo, ore_iniziali: oreIniziali ? parseFloat(oreIniziali) : 0 });
      onClose();
    } catch (e) { setErrore(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="modale-overlay" onClick={onClose}>
      <div className="modale modale-sm" onClick={e => e.stopPropagation()}>
        <div className="modale-header">
          <h2>✏️ Modifica Studente</h2>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modale-body">
          <div className="studente-info-box">
            <div className="avatar">{studente.nome[0]}{studente.cognome[0]}</div>
            <div>
              <strong>{studente.nome} {studente.cognome}</strong>
              <p>Tipo attuale: {studente.tipo_pagamento === "abbonamento" ? "📅 Abbonamento" : "⏱ A ore"}</p>
            </div>
          </div>
          <div className="form-group">
            <label>Tipo pagamento</label>
            <div className="radio-group">
              <label className={`radio-card ${tipo === "abbonamento" ? "selected" : ""}`}>
                <input type="radio" name="tipo" value="abbonamento" checked={tipo === "abbonamento"} onChange={() => setTipo("abbonamento")} />
                <span>📅 Abbonamento</span>
                <small>Pagamento fisso mensile</small>
              </label>
              <label className={`radio-card ${tipo === "ore" ? "selected" : ""}`}>
                <input type="radio" name="tipo" value="ore" checked={tipo === "ore"} onChange={() => setTipo("ore")} />
                <span>⏱ A ore</span>
                <small>Pagamento a consumo</small>
              </label>
            </div>
          </div>
          {cambioTipo && tipo === "abbonamento" && (
            <div className="alert alert-warning">⚠️ Le ore residue ({Number(studente.ore_residue).toFixed(1)}h) verranno azzerate.</div>
          )}
          {cambioTipo && tipo === "ore" && (
            <div className="form-group">
              <label>Ore iniziali da assegnare</label>
              <input type="number" className="input" placeholder="es: 20" value={oreIniziali} onChange={e => setOreIniziali(e.target.value)} min="0" step="0.5" />
            </div>
          )}
          {errore && <div className="alert alert-error">{errore}</div>}
        </div>
        <div className="modale-footer">
          <button className="btn btn-outline" onClick={onClose}>Annulla</button>
          <button className="btn btn-primary" onClick={handleSalva} disabled={loading || !cambioTipo}>
            {loading ? "Salvataggio..." : "Salva"}
          </button>
        </div>
      </div>
    </div>
  );
}
