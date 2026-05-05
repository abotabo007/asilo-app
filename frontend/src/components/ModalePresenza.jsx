// src/components/ModalePresenza.jsx
import { useState } from "react";

// Restituisce la data e ora corrente nel formato richiesto dall'input datetime-local
// es: "2024-01-15T08:30"
function orarioAdesso() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export default function ModalePresenza({ studente, onClose, onIngresso, onUscita }) {
  const [orarioIngresso, setOrarioIngresso] = useState(orarioAdesso());
  const [orarioUscita, setOrarioUscita] = useState(orarioAdesso());
  const [usaOrarioPersonalizzato, setUsaOrarioPersonalizzato] = useState(false);
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
      const orario = usaOrarioPersonalizzato ? orarioIngresso : null;
      const data = await onIngresso(studente.id, orario);
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
      const orario = usaOrarioPersonalizzato ? orarioUscita : null;
      const data = await onUscita(studente.id, orario);
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
          {/* Info studente */}
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

          {/* Toggle orario personalizzato */}
          {!risultato && (
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={usaOrarioPersonalizzato}
                onChange={(e) => setUsaOrarioPersonalizzato(e.target.checked)}
              />
              <span>Inserisci orario manualmente</span>
            </label>
          )}

          {/* Campi orario personalizzato */}
          {!risultato && usaOrarioPersonalizzato && (
            <div className="orari-grid">
              <div className="form-group">
                <label>🟢 Orario ingresso</label>
                <input
                  type="datetime-local"
                  className="input"
                  value={orarioIngresso}
                  onChange={(e) => setOrarioIngresso(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>🔴 Orario uscita</label>
                <input
                  type="datetime-local"
                  className="input"
                  value={orarioUscita}
                  onChange={(e) => setOrarioUscita(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Avviso ore esaurite */}
          {studente.tipo_pagamento === "ore" && studente.ore_residue <= 0 && (
            <div className="alert alert-warning">
              ⚠️ Attenzione: questo studente ha esaurito il credito ore!
            </div>
          )}

          {/* Bottoni azione */}
          {!risultato && (
            <div className="presenza-buttons">
              <button className="btn-ingresso" onClick={handleIngresso} disabled={loading}>
                🟢 Registra Ingresso
              </button>
              <button className="btn-uscita" onClick={handleUscita} disabled={loading}>
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