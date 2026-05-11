// src/components/ModaleStorico.jsx
import { useState, useEffect } from "react";

export default function ModaleStorico({ studente, onClose, api }) {
  const [presenze, setPresenze] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const carica = async () => {
      try {
        const res = await fetch(`${api}/presenze/${studente.id}`);
        setPresenze(await res.json());
      } catch { setPresenze([]); }
      finally { setLoading(false); }
    };
    carica();
  }, [studente.id]);

  const fmt = (iso, mode = "ora") => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (mode === "data") return d.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" });
    return d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  };

  const totaleOre = presenze.filter(p => p.ore_consumate).reduce((a, p) => a + p.ore_consumate, 0);

  return (
    <div className="modale-overlay" onClick={onClose}>
      <div className="modale modale-lg" onClick={e => e.stopPropagation()}>
        <div className="modale-header">
          <h2>📋 Storico Presenze</h2>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modale-body">
          <div className="studente-info-box">
            <div className="avatar">{studente.nome[0]}{studente.cognome[0]}</div>
            <div>
              <strong>{studente.nome} {studente.cognome}</strong>
              <p>{studente.tipo_pagamento === "ore" ? `Ore rimaste: ${Number(studente.ore_residue).toFixed(1)}h` : "Abbonamento mensile"}</p>
            </div>
          </div>

          {loading ? (
            <div className="loading"><div className="loading-spinner"></div>Caricamento...</div>
          ) : presenze.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h3>Nessuna presenza</h3>
              <p>Non ci sono presenze registrate per questo studente</p>
            </div>
          ) : (
            <>
              {studente.tipo_pagamento === "ore" && (
                <div className="storico-summary">Totale ore consumate: <strong>{totaleOre.toFixed(1)}h</strong></div>
              )}
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr><th>Data</th><th>Entrata</th><th>Uscita</th><th>Ore</th><th>Stato</th></tr>
                  </thead>
                  <tbody>
                    {presenze.map(p => (
                      <tr key={p.id}>
                        <td>{fmt(p.ingresso, "data")}</td>
                        <td>{fmt(p.ingresso)}</td>
                        <td>{fmt(p.uscita)}</td>
                        <td>{p.ore_consumate ? `${p.ore_consumate}h` : "—"}</td>
                        <td>
                          {p.uscita
                            ? <span className="badge badge-success">✓ Completata</span>
                            : <span className="badge badge-warning">⏳ In corso</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
        <div className="modale-footer">
          <button className="btn btn-outline" onClick={onClose}>Chiudi</button>
        </div>
      </div>
    </div>
  );
}
