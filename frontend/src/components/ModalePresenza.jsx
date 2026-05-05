// src/components/ModalePresenza.jsx
// Fix: bottoni conferma sempre visibili, orario manuale modifica solo il valore inviato
import { useState } from "react";

function orarioAdesso() {
  const now = new Date();
  const pad = n => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function formatOra(isoString) {
  if (!isoString) return "-";
  return new Date(isoString).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
}

function formatData(isoString) {
  if (!isoString) return "";
  return new Date(isoString).toLocaleDateString("it-IT", { day: "2-digit", month: "long" });
}

export default function ModalePresenza({ studente, onClose, onIngresso, onUscita }) {
  const [orarioIngresso, setOrarioIngresso] = useState(orarioAdesso());
  const [orarioUscita,   setOrarioUscita]   = useState(orarioAdesso());
  const [orarioManuale,  setOrarioManuale]  = useState(false);
  const [loading,        setLoading]        = useState(false);
  const [risultato,      setRisultato]      = useState(null);
  const [errore,         setErrore]         = useState("");

  const handleIngresso = async () => {
    setErrore(""); setLoading(true);
    try {
      const orario = orarioManuale ? orarioIngresso : null;
      const data = await onIngresso(studente.id, orario);
      setRisultato({
        tipo: "ingresso",
        titolo: "Entrata registrata!",
        dettaglio: `${studente.nome} è entrato alle ${formatOra(data.ingresso)} del ${formatData(data.ingresso)}`,
      });
    } catch (e) { setErrore(e.message); }
    finally { setLoading(false); }
  };

  const handleUscita = async () => {
    setErrore(""); setLoading(true);
    try {
      const orario = orarioManuale ? orarioUscita : null;
      const data = await onUscita(studente.id, orario);
      const ore = data.presenza.ore_consumate;
      setRisultato({
        tipo: "uscita",
        titolo: "Uscita registrata!",
        dettaglio:
          `${studente.nome} è uscito alle ${formatOra(data.presenza.uscita)}` +
          ` · ${ore}h in asilo` +
          (studente.tipo_pagamento === "ore"
            ? ` · Ore rimaste: ${Number(data.studente.ore_residue).toFixed(1)}h`
            : ""),
      });
    } catch (e) { setErrore(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="modale-overlay" onClick={onClose}>
      <div className="modale modale-sm" onClick={e => e.stopPropagation()}>

        <div className="modale-header">
          <h2>⏰ Registra presenza</h2>
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
                  ? `⏱ A ore · Credito rimasto: ${Number(studente.ore_residue).toFixed(1)}h`
                  : "📅 Abbonamento mensile"}
              </p>
            </div>
          </div>

          {studente.tipo_pagamento === "ore" && studente.ore_residue <= 0 && !risultato && (
            <div className="alert alert-warning">
              ⚠️ Questo bambino ha esaurito le ore disponibili!
            </div>
          )}

          {risultato ? (
            <div className="success-feedback">
              <div className="success-icon">
                {risultato.tipo === "ingresso" ? "🟢" : "✅"}
              </div>
              <div className="success-title">{risultato.titolo}</div>
              <div className="success-detail">{risultato.dettaglio}</div>
            </div>
          ) : (
            <>
              <label className="toggle-row">
                <input
                  type="checkbox"
                  checked={orarioManuale}
                  onChange={e => setOrarioManuale(e.target.checked)}
                />
                <div className="toggle-label">
                  <span>Inserisci orario manualmente</span>
                  <small>Attiva per specificare un orario diverso da adesso</small>
                </div>
              </label>

              {orarioManuale ? (
                <div className="orari-box">
                  <div className="orario-field">
                    <div className="orario-field-label">
                      <span className="orario-dot green"></span>
                      Orario di entrata
                    </div>
                    <input
                      type="datetime-local"
                      className="input"
                      value={orarioIngresso}
                      onChange={e => setOrarioIngresso(e.target.value)}
                    />
                    <button
                      className="btn-presenza btn-presenza-ingresso"
                      onClick={handleIngresso}
                      disabled={loading}
                    >
                      <span className="btn-presenza-icon">🟢</span>
                      <span>Conferma entrata</span>
                    </button>
                  </div>

                  <div className="orari-divider">oppure</div>

                  <div className="orario-field">
                    <div className="orario-field-label">
                      <span className="orario-dot red"></span>
                      Orario di uscita
                    </div>
                    <input
                      type="datetime-local"
                      className="input"
                      value={orarioUscita}
                      onChange={e => setOrarioUscita(e.target.value)}
                    />
                    <button
                      className="btn-presenza btn-presenza-uscita"
                      onClick={handleUscita}
                      disabled={loading}
                    >
                      <span className="btn-presenza-icon">🔴</span>
                      <span>Conferma uscita</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="presenza-section-label">Registra con l'orario attuale</p>
                  <div className="presenza-buttons">
                    <button className="btn-ingresso" onClick={handleIngresso} disabled={loading}>
                      <span className="btn-big-icon">🟢</span>
                      <span className="btn-big-label">Conferma entrata</span>
                    </button>
                    <button className="btn-uscita" onClick={handleUscita} disabled={loading}>
                      <span className="btn-big-icon">🔴</span>
                      <span className="btn-big-label">Conferma uscita</span>
                    </button>
                  </div>
                </>
              )}

              {errore && <div className="alert alert-error">❌ {errore}</div>}
            </>
          )}

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
