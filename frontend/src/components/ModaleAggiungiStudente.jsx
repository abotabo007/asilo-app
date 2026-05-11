// src/components/ModaleAggiungiStudente.jsx
import { useState } from "react";

export default function ModaleAggiungiStudente({ onClose, onSalva }) {
  const [form, setForm] = useState({ nome: "", cognome: "", tipo_pagamento: "abbonamento", ore_iniziali: "" });
  const [errore,  setErrore]  = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = e => { setForm({ ...form, [e.target.name]: e.target.value }); setErrore(""); };

  const handleSubmit = async () => {
    setErrore("");
    if (!form.nome.trim() || !form.cognome.trim()) { setErrore("Nome e cognome sono obbligatori"); return; }
    if (form.tipo_pagamento === "ore" && form.ore_iniziali && parseFloat(form.ore_iniziali) < 0) {
      setErrore("Le ore iniziali non possono essere negative"); return;
    }
    try {
      setLoading(true);
      await onSalva({
        nome: form.nome.trim(), cognome: form.cognome.trim(),
        tipo_pagamento: form.tipo_pagamento,
        ore_iniziali: form.ore_iniziali ? parseFloat(form.ore_iniziali) : 0,
      });
    } catch (e) { setErrore(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="modale-overlay" onClick={onClose}>
      <div className="modale" onClick={e => e.stopPropagation()}>
        <div className="modale-header">
          <h2>👶 Nuovo Studente</h2>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modale-body">
          <div className="form-group">
            <label>Nome *</label>
            <input type="text" name="nome" placeholder="es: Marco" value={form.nome} onChange={handleChange} className="input" />
          </div>
          <div className="form-group">
            <label>Cognome *</label>
            <input type="text" name="cognome" placeholder="es: Rossi" value={form.cognome} onChange={handleChange} className="input" />
          </div>
          <div className="form-group">
            <label>Tipo di pagamento *</label>
            <div className="radio-group">
              <label className={`radio-card ${form.tipo_pagamento === "abbonamento" ? "selected" : ""}`}>
                <input type="radio" name="tipo_pagamento" value="abbonamento" checked={form.tipo_pagamento === "abbonamento"} onChange={handleChange} />
                <span>📅 Abbonamento</span><small>Pagamento fisso mensile</small>
              </label>
              <label className={`radio-card ${form.tipo_pagamento === "ore" ? "selected" : ""}`}>
                <input type="radio" name="tipo_pagamento" value="ore" checked={form.tipo_pagamento === "ore"} onChange={handleChange} />
                <span>⏱ A ore</span><small>Pagamento a consumo</small>
              </label>
            </div>
          </div>
          {form.tipo_pagamento === "ore" && (
            <div className="form-group">
              <label>Ore iniziali (opzionale)</label>
              <input type="number" name="ore_iniziali" placeholder="es: 20" value={form.ore_iniziali} onChange={handleChange} min="0" step="0.5" className="input" />
              <small className="hint">Puoi aggiungere ore anche in seguito</small>
            </div>
          )}
          {errore && <div className="alert alert-error">{errore}</div>}
        </div>
        <div className="modale-footer">
          <button className="btn btn-outline" onClick={onClose}>Annulla</button>
          <button className="btn btn-primary-teal" onClick={handleSubmit} disabled={loading}>
            {loading ? "Salvataggio..." : "Aggiungi Studente"}
          </button>
        </div>
      </div>
    </div>
  );
}
