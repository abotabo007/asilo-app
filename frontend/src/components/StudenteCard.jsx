// src/components/StudenteCard.jsx
import { useState } from "react";

export default function StudenteCard({
  studente,
  onElimina,
  onPresenza,
  onStorico,
  onAggiungiOre,
}) {
  const [aggiungiOreMode, setAggiungiOreMode] = useState(false);
  const [oreInput, setOreInput] = useState("");
  const [erroreOre, setErroreOre] = useState("");

  const isOre = studente.tipo_pagamento === "ore";
  const oreResidueFormatted = isOre ? Number(studente.ore_residue).toFixed(1) : null;
  const oreBasse = isOre && studente.ore_residue < 2;

  const handleAggiungiOre = async () => {
    setErroreOre("");
    const val = parseFloat(oreInput);
    if (isNaN(val) || val <= 0) {
      setErroreOre("Inserire un numero valido > 0");
      return;
    }
    try {
      await onAggiungiOre(val);
      setOreInput("");
      setAggiungiOreMode(false);
    } catch (e) {
      setErroreOre(e.message);
    }
  };

  return (
    <div className={`studente-card ${oreBasse ? "ore-basse" : ""}`}>
      {/* Header card */}
      <div className="card-header">
        <div className="avatar">
          {studente.nome[0]}{studente.cognome[0]}
        </div>
        <div className="card-info">
          <h3>{studente.nome} {studente.cognome}</h3>
          <span className={`badge badge-${studente.tipo_pagamento}`}>
            {studente.tipo_pagamento === "abbonamento" ? "📅 Abbonamento" : "⏱ A ore"}
          </span>
        </div>
        <button
          className="btn-icon btn-danger"
          onClick={onElimina}
          title="Elimina studente"
        >
          🗑
        </button>
      </div>

      {/* Ore residue (solo per studenti "ore") */}
      {isOre && (
        <div className={`ore-display ${oreBasse ? "ore-warning" : ""}`}>
          <span className="ore-label">Ore residue:</span>
          <span className="ore-value">{oreResidueFormatted}h</span>
          {oreBasse && <span className="ore-alert">⚠️ Credito basso</span>}
        </div>
      )}

      {/* Aggiungi ore */}
      {isOre && (
        <div className="aggiungi-ore-section">
          {!aggiungiOreMode ? (
            <button
              className="btn btn-sm btn-outline"
              onClick={() => setAggiungiOreMode(true)}
            >
              + Aggiungi ore
            </button>
          ) : (
            <div className="ore-input-group">
              <input
                type="number"
                placeholder="es: 10"
                value={oreInput}
                min="0.5"
                step="0.5"
                onChange={(e) => setOreInput(e.target.value)}
                className="input-sm"
              />
              <button className="btn btn-sm btn-success" onClick={handleAggiungiOre}>
                ✓
              </button>
              <button
                className="btn btn-sm btn-outline"
                onClick={() => {
                  setAggiungiOreMode(false);
                  setErroreOre("");
                  setOreInput("");
                }}
              >
                ✕
              </button>
              {erroreOre && <span className="errore-inline">{erroreOre}</span>}
            </div>
          )}
        </div>
      )}

      {/* Presenze totali */}
      <div className="card-meta">
        <span>📋 {studente.totale_presenze} presenze registrate</span>
      </div>

      {/* Azioni */}
      <div className="card-actions">
        <button className="btn btn-primary btn-sm" onClick={onPresenza}>
          ⏰ Ingresso / Uscita
        </button>
        <button className="btn btn-outline btn-sm" onClick={onStorico}>
          📋 Storico
        </button>
      </div>
    </div>
  );
}
