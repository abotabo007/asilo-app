// src/components/ModaleStorico.jsx
import { useState, useEffect } from "react";

export default function ModaleStorico({ studente, onClose, api }) {
  const [presenze, setPresenze] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carica = async () => {
      try {
        const res = await fetch(`${api}/presenze/${studente.id}`);
        const data = await res.json();
        setPresenze(data);
      } catch {
        setPresenze([]);
      } finally {
        setLoading(false);
      }
    };
    carica();
  }, [studente.id]);

  const formatData = (iso) => {
    if (!iso) return "-";
    return new Date(iso).toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatOra = (iso) => {
    if (!iso) return "-";
    return new Date(iso).toLocaleTimeString("it-IT", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const totaleOre = presenze
    .filter((p) => p.ore_consumate)
    .reduce((acc, p) => acc + p.ore_consumate, 0);

  return (
    <div className="modale-overlay" onClick={onClose}>
      <div className="modale modale-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modale-header">
          <h2>📋 Storico Presenze</h2>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        <div className="modale-body">
          <div className="studente-info-box">
            <div className="avatar">
              {studente.nome[0]}{studente.cognome[0]}
            </div>
            <div>
              <strong>{studente.nome} {studente.cognome}</strong>
              <p>
                {studente.tipo_pagamento === "ore"
                  ? `Ore residue: ${Number(studente.ore_residue).toFixed(1)}h`
                  : "Abbonamento"}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="loading">Caricamento presenze...</div>
          ) : presenze.length === 0 ? (
            <div className="empty-state">
              <span>📭</span>
              <p>Nessuna presenza registrata</p>
            </div>
          ) : (
            <>
              {studente.tipo_pagamento === "ore" && (
                <div className="storico-summary">
                  Totale ore consumate: <strong>{totaleOre.toFixed(1)}h</strong>
                </div>
              )}
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Ingresso</th>
                      <th>Uscita</th>
                      <th>Ore</th>
                      <th>Stato</th>
                    </tr>
                  </thead>
                  <tbody>
                    {presenze.map((p) => (
                      <tr key={p.id}>
                        <td>{formatData(p.ingresso)}</td>
                        <td>{formatOra(p.ingresso)}</td>
                        <td>{p.uscita ? formatOra(p.uscita) : "—"}</td>
                        <td>{p.ore_consumate ? `${p.ore_consumate}h` : "—"}</td>
                        <td>
                          {p.uscita ? (
                            <span className="badge badge-success">Completata</span>
                          ) : (
                            <span className="badge badge-warning">In corso</span>
                          )}
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
