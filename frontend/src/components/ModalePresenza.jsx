// src/components/ModalePresenza.jsx
import { useState } from "react";

export default function ModalePresenza({ studente, onClose, onIngresso, onUscita }) {
  const [messaggio, setMessaggio] = useState("");
  const [errore, setErrore] = useState("");
  const [loading, setLoading] = useState(false);
  const [risultato, setRisultato] = useState(null);

  const formatOra = (isoString) => {
    if (!isoString) return "-";
    return new Date(isoString).toLocaleTimeString("it-IT", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleIngresso = async () => {
    setErrore("");
    setMessaggio("");
    setLoading(true);
    try {
      const data = await onIngresso(studente.id);
      setMessaggio(`✅ Ingresso registrato alle ${formatOra(data.ingresso)}`);
      setRisultato("ingresso");
    } catch (e) {
      setErrore(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUscita = async () => {
    setErrore("");
    setMessaggio("");
    setLoading(true);
    try {
      const data = await onUscita(studente.id);
      const ore = data.presenza.ore_consumate;
      setMessaggio(
        `✅ Uscita registrata alle ${formatOra(data.presenza.uscita)}. ` +
        `Ore consumate: ${ore}h` +
        (studente.tipo_pagamento === "ore"
          ? ` — Ore residue: ${Number(data.studente.ore_residue).toFixed(1)}h`
          : "")
      );
      setRisultato("uscita");
    } catch (e) {
      setErrore(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modale-overlay" onClick={onClose}>
      <div className="modale modale-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modale-header">
          <h2>⏰ Presenza</h2>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        <div className="modale-body">
          <div className="studente-info-box">
            <div className="avatar avatar-lg">
              {studente.nome[0]}{studente.cognome[0]}
            </div>
            <div>
              <strong>{studente.nome} {studente.cognome}</strong>
              <p>
                {studente.tipo_pagamento === "ore"
                  ? `⏱ A ore — Credito: ${Number(studente.ore_residue).toFixed(1)}h`
                  : "📅 Abbonamento"}
              </p>
            </div>
          </div>

          {studente.tipo_pagamento === "ore" && studente.ore_residue <= 0 && (
            <div className="alert alert-warning">
              ⚠️ Attenzione: questo studente ha esaurito il credito ore!
            </div>
          )}

          {!risultato && (
            <div className="presenza-buttons">
              <button
                className="btn btn-ingresso"
                onClick={handleIngresso}
                disabled={loading}
              >
                🟢 Registra Ingresso
              </button>
              <button
                className="btn btn-uscita"
                onClick={handleUscita}
                disabled={loading}
              >
                🔴 Registra Uscita
              </button>
            </div>
          )}

          {messaggio && <div className="alert alert-success">{messaggio}</div>}
          {errore && <div className="alert alert-error">❌ {errore}</div>}
        </div>

        <div className="modale-footer">
          <button className="btn btn-outline" onClick={onClose}>
            {risultato ? "Chiudi" : "Annulla"}
          </button>
        </div>
      </div>
    </div>
  );
}
