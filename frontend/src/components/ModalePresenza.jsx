// src/components/ModalePresenza.jsx
import { useState } from "react";

function orarioAdesso() {
  const now = new Date();
  const pad = n => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}
function formatOra(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
}
function formatData(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("it-IT", { day: "2-digit", month: "long" });
}

export default function ModalePresenza({ studente, onClose, onIngresso, onUscita }) {
  const [tab,            setTab]            = useState("entrata");
  const [orarioIngresso, setOrarioIngresso] = useState(orarioAdesso());
  const [orarioUscita,   setOrarioUscita]   = useState(orarioAdesso());
  const [usaManuale,     setUsaManuale]     = useState(false);
  const [loading,        setLoading]        = useState(false);
  const [risultato,      setRisultato]      = useState(null);
  const [errore,         setErrore]         = useState("");

  const cambiaTab = (t) => {
    setTab(t); setErrore("");
    if (t === "entrata") setOrarioIngresso(orarioAdesso());
    else                 setOrarioUscita(orarioAdesso());
  };

  const handleConferma = async () => {
    setErrore(""); setLoading(true);
    try {
      if (tab === "entrata") {
        const data = await onIngresso(studente.id, usaManuale ? orarioIngresso : null);
        setRisultato({ tipo: "entrata", titolo: "Entrata registrata!",
          dettaglio: `${studente.nome} è entrato alle ${formatOra(data.ingresso)} del ${formatData(data.ingresso)}` });
      } else {
        const data = await onUscita(studente.id, usaManuale ? orarioUscita : null);
        const ore = data.presenza.ore_consumate;
        setRisultato({ tipo: "uscita", titolo: "Uscita registrata!",
          dettaglio: `${studente.nome} è uscito alle ${formatOra(data.presenza.uscita)} · ${ore}h in asilo` +
            (studente.tipo_pagamento === "ore" ? ` · Ore rimaste: ${Number(data.studente.ore_residue).toFixed(1)}h` : "") });
      }
    } catch (e) { setErrore(e.message); }
    finally { setLoading(false); }
  };

  const isEntrata = tab === "entrata";

  return (
    <div className="mp-overlay" onClick={onClose}>
      <div className="mp-modale" onClick={e => e.stopPropagation()}>

        <div className="mp-header">
          <h2>⏰ Registra presenza</h2>
          <button className="mp-close" onClick={onClose}>✕</button>
        </div>

        <div className="mp-body">
          {/* Studente */}
          <div className="mp-studente">
            <div className="mp-avatar">{studente.nome[0]}{studente.cognome[0]}</div>
            <div className="mp-studente-info">
              <strong>{studente.nome} {studente.cognome}</strong>
              <span>{studente.tipo_pagamento === "ore"
                ? `⏱ A ore · Credito: ${Number(studente.ore_residue).toFixed(1)}h`
                : "📅 Abbonamento mensile"}</span>
            </div>
          </div>

          {studente.tipo_pagamento === "ore" && studente.ore_residue <= 0 && !risultato && (
            <div className="mp-alert mp-alert-warn">⚠️ Questo bambino ha esaurito le ore disponibili!</div>
          )}

          {risultato ? (
            <div className="mp-successo">
              <div className="mp-successo-icon">{risultato.tipo === "entrata" ? "🟢" : "✅"}</div>
              <div className="mp-successo-titolo">{risultato.titolo}</div>
              <div className="mp-successo-dettaglio">{risultato.dettaglio}</div>
            </div>
          ) : (
            <>
              {/* Tab selector */}
              <div className="mp-tabs">
                <button className={`mp-tab ${tab === "entrata" ? "mp-tab-active" : ""}`} onClick={() => cambiaTab("entrata")}>
                  <span className="mp-tab-dot mp-dot-green"></span> Entrata
                </button>
                <button className={`mp-tab ${tab === "uscita" ? "mp-tab-active" : ""}`} onClick={() => cambiaTab("uscita")}>
                  <span className="mp-tab-dot mp-dot-red"></span> Uscita
                </button>
              </div>

              {/* Contenuto tab */}
              <div className={`mp-tab-content ${isEntrata ? "mp-content-entrata" : "mp-content-uscita"}`}>
                {/* Toggle manuale */}
                <label className="mp-toggle">
                  <input type="checkbox" checked={usaManuale} onChange={e => setUsaManuale(e.target.checked)} />
                  <div className="mp-toggle-testo">
                    <span>Orario personalizzato</span>
                    <small>{usaManuale ? "Modifica la data e l'ora qui sotto" : "Verrà usato l'orario attuale"}</small>
                  </div>
                </label>

                {/* Campo datetime */}
                {usaManuale && (
                  <div className="mp-orario-field">
                    <label className="mp-orario-label">
                      {isEntrata ? "🟢 Orario di entrata" : "🔴 Orario di uscita"}
                    </label>
                    <input
                      type="datetime-local" className="mp-input"
                      value={isEntrata ? orarioIngresso : orarioUscita}
                      onChange={e => isEntrata ? setOrarioIngresso(e.target.value) : setOrarioUscita(e.target.value)}
                    />
                  </div>
                )}

                {errore && <div className="mp-alert mp-alert-error">❌ {errore}</div>}

                {/* Bottone conferma */}
                <button
                  className={`mp-btn-conferma ${isEntrata ? "mp-btn-entrata" : "mp-btn-uscita"}`}
                  onClick={handleConferma} disabled={loading}
                >
                  {loading ? "Salvataggio..." : (
                    <><span className="mp-btn-icon">{isEntrata ? "🟢" : "🔴"}</span>
                    <span>{isEntrata ? "Conferma entrata" : "Conferma uscita"}</span></>
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        <div className="mp-footer">
          <button className="mp-btn-annulla" onClick={onClose}>
            {risultato ? "Chiudi" : "Annulla"}
          </button>
        </div>
      </div>
    </div>
  );
}
