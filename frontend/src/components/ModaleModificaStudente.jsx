// src/components/ModaleModificaStudente.jsx
import { useState } from "react";

export default function ModaleModificaStudente({ studente, onClose, onSalva }) {
  const [tipo, setTipo] = useState(studente.tipo_pagamento);
  const [oreIniziali, setOreIniziali] = useState("");
  const [errore, setErrore] = useState("");
  const [loading, setLoading] = useState(false);

  const cambioTipo = tipo !== studente.tipo_pagamento;

  const handleSalva = async () => {
    setErrore("");

    if (!cambioTipo) {
      onClose();
      return;
    }

    if (tipo === "ore" && oreIniziali && parseFloat(oreIniziali) < 0) {
      setErrore("Le ore non possono essere negative");
      return;
    }

    try {
      setLoading(true);
      await onSalva(studente.id, {
        tipo_pagamento: tipo,
        ore_iniziali: oreIniziali ? parseFloat(oreIniziali) : 0,
      });
      onClose();
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
          <h2>✏️ Modifica Studente</h2>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        <div className="modale-body">
          <div className="studente-info-box">
            <div className="avatar">
              {studente.nome[0]}{studente.cognome[0]}
            </div>
            <div>
              <strong>{studente.nome} {studente.cognome}</strong>
              <p>Tipo attuale: {studente.tipo_pagamento === "abbonamento" ? "📅 Abbonamento" : "⏱ A ore"}</p>
            </div>
          </div>

          <div className="form-group">
            <label>Nuovo tipo pagamento</label>
            <div className="radio-group">
              <label className={`radio-card ${tipo === "abbonamento" ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="tipo"
                  value="abbonamento"
                  checked={tipo === "abbonamento"}
                  onChange={() => setTipo("abbonamento")}
                />
                <span>📅 Abbonamento</span>
                <small>Pagamento fisso mensile</small>
              </label>
              <label className={`radio-card ${tipo === "ore" ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="tipo"
                  value="ore"
                  checked={tipo === "ore"}
                  onChange={() => setTipo("ore")}
                />
                <span>⏱ A ore</span>
                <small>Pagamento a consumo</small>
              </label>
            </div>
          </div>

          {/* Avviso se sta cambiando tipo */}
          {cambioTipo && tipo === "abbonamento" && (
            <div className="alert alert-warning">
              ⚠️ Passando ad abbonamento, le ore residue ({Number(studente.ore_residue).toFixed(1)}h) verranno azzerate.
            </div>
          )}

          {/* Ore iniziali se passa ad "ore" */}
          {cambioTipo && tipo === "ore" && (
            <div className="form-group">
              <label>Ore iniziali da assegnare</label>
              <input
                type="number"
                className="input"
                placeholder="es: 20"
                value={oreIniziali}
                onChange={(e) => setOreIniziali(e.target.value)}
                min="0"
                step="0.5"
              />
              <small className="hint">Puoi aggiungere altre ore anche in seguito</small>
            </div>
          )}

          {errore && <div className="alert alert-error">{errore}</div>}
        </div>

        <div className="modale-footer">
          <button className="btn btn-outline" onClick={onClose}>Annulla</button>
          <button
            className="btn btn-primary"
            onClick={handleSalva}
            disabled={loading || !cambioTipo}
            title={!cambioTipo ? "Nessuna modifica effettuata" : ""}
          >
            {loading ? "Salvataggio..." : "Salva Modifiche"}
          </button>
        </div>
      </div>
    </div>
  );
}