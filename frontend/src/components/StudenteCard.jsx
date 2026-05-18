// src/components/StudenteCard.jsx
import { useState } from "react";

export default function StudenteCard({
  studente, onElimina, onPresenza, onStorico, onAggiungiOre, onModifica, onNote,
}) {
  const [addOreMode, setAddOreMode] = useState(false);
  const [oreInput,   setOreInput]   = useState("");
  const [errOre,     setErrOre]     = useState("");

  const isOre   = studente.tipo_pagamento === "ore";
  const oreBasse = isOre && studente.ore_residue < 2;
  const haNota  = studente.note && studente.note.trim().length > 0;

  const handleAggiungiOre = async () => {
    setErrOre("");
    const val = parseFloat(oreInput);
    if (isNaN(val) || val <= 0) { setErrOre("Inserire un numero > 0"); return; }
    try {
      await onAggiungiOre(val);
      setOreInput(""); setAddOreMode(false);
    } catch (e) { setErrOre(e.message); }
  };

  return (
  <div className={`studente-card ${oreBasse ? "ore-basse" : ""}`}>

    <div className="card-body">
      {/* Header */}
      <div className="card-header">
        <div className={`avatar ${studente.tipo_pagamento === "ore" ? "avatar-ore" : ""}`}>
          {studente.nome[0]}{studente.cognome[0]}
        </div>
        <div className="card-info">
          <h3>{studente.nome} {studente.cognome}</h3>
          <span className={`badge badge-${studente.tipo_pagamento}`}>
            {studente.tipo_pagamento === "abbonamento" ? "📅 Abbonamento" : "⏱ A ore"}
          </span>
        </div>
        <div className="card-actions-top">
          <button className="btn-icon" onClick={onNote} title="Note">📝</button>
          <button className="btn-icon" onClick={onModifica} title="Modifica">✏️</button>
          <button className="btn-icon btn-danger-icon" onClick={onElimina} title="Elimina">🗑</button>
        </div>
      </div>

      <div className="card-divider" />

      {/* Ore residue */}
      {isOre && (
        <div className={`ore-display ${oreBasse ? "ore-warning" : ""}`}>
          <span className="ore-icon">{oreBasse ? "⚠️" : "⏱"}</span>
          <div className="ore-info">
            <span className="ore-label">Ore residue</span>
            <span className="ore-value">{Number(studente.ore_residue).toFixed(1)}h</span>
          </div>
          {oreBasse && <span className="ore-alert">Credito basso!</span>}
        </div>
      )}

      {/* Aggiungi ore */}
      {isOre && (
        <div className="aggiungi-ore-section">
          {!addOreMode ? (
            <button className="btn-aggiungi-ore" onClick={() => setAddOreMode(true)}>
              + Aggiungi ore
            </button>
          ) : (
            <div className="ore-input-group">
              <input
                type="number" placeholder="es: 10" value={oreInput}
                min="0.5" step="0.5" className="input-sm"
                onChange={e => setOreInput(e.target.value)}
              />
              <button className="btn btn-success btn-sm" onClick={handleAggiungiOre}>✓</button>
              <button className="btn-aggiungi-ore" onClick={() => { setAddOreMode(false); setErrOre(""); setOreInput(""); }}>✕</button>
              {errOre && <span className="errore-inline">{errOre}</span>}
            </div>
          )}
        </div>
      )}

      {/* Nota */}
      <div
        className={`note-preview ${haNota ? "has-note" : ""}`}
        onClick={onNote}
        title="Clicca per modificare le note"
      >
        {haNota ? `📝 ${studente.note}` : "📝 Nessuna nota — clicca per aggiungere"}
      </div>

      {/* Meta */}
      <div className="card-meta">
        <span>📋</span>
        <span>{studente.totale_presenze} presenze registrate</span>
      </div>
    </div>

    {/* Footer */}
    <div className="card-footer">
      <button className="btn-primary-teal" onClick={onPresenza}>
        ⏰ Entrata / Uscita
      </button>
      <button className="btn-outline btn-sm" onClick={onStorico} title="Storico presenze">
        📋
      </button>
    </div>

  </div>
  );
}
