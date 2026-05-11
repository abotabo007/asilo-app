// src/components/ModaleNote.jsx
import { useState } from "react";

const MAX_CHARS = 500;

export default function ModaleNote({ studente, onClose, onSalva }) {
  const [nota,    setNota]    = useState(studente.note || "");
  const [loading, setLoading] = useState(false);
  const [errore,  setErrore]  = useState("");
  const [salvato, setSalvato] = useState(false);

  const charsRimasti = MAX_CHARS - nota.length;

  const handleSalva = async () => {
    setErrore("");
    if (nota.length > MAX_CHARS) { setErrore(`Massimo ${MAX_CHARS} caratteri`); return; }
    try {
      setLoading(true);
      await onSalva(nota);
      setSalvato(true);
      setTimeout(() => setSalvato(false), 2500);
    } catch (e) {
      setErrore(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modale-overlay" onClick={onClose}>
      <div className="modale modale-sm" onClick={e => e.stopPropagation()}>

        <div className="modale-header">
          <h2>📝 Note studente</h2>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        <div className="modale-body">
          {/* Info studente */}
          <div className="studente-info-box">
            <div className="avatar">{studente.nome[0]}{studente.cognome[0]}</div>
            <div>
              <strong>{studente.nome} {studente.cognome}</strong>
              <p>{studente.tipo_pagamento === "abbonamento" ? "📅 Abbonamento" : `⏱ A ore · ${Number(studente.ore_residue).toFixed(1)}h rimaste`}</p>
            </div>
          </div>

          {/* Campo note */}
          <div className="form-group">
            <div className="note-sezione-titolo">
              <span>Note</span>
              <span className={`note-contatore ${charsRimasti < 50 ? "text-warning" : ""}`}
                style={{ color: charsRimasti < 50 ? "var(--orange)" : undefined }}>
                {charsRimasti} caratteri rimasti
              </span>
              {salvato && <span className="note-saved-badge">✓ Salvato</span>}
            </div>
            <textarea
              className="input"
              placeholder="Inserisci note, allergie, esigenze particolari, contatti di emergenza..."
              value={nota}
              onChange={e => { setNota(e.target.value); setSalvato(false); }}
              maxLength={MAX_CHARS}
              rows={6}
            />
          </div>

          {errore && <div className="alert alert-error">❌ {errore}</div>}
        </div>

        <div className="modale-footer">
          <button className="btn btn-outline" onClick={onClose}>Chiudi</button>
          <button className="btn btn-primary-teal" onClick={handleSalva} disabled={loading}>
            {loading ? "Salvataggio..." : "💾 Salva note"}
          </button>
        </div>
      </div>
    </div>
  );
}
