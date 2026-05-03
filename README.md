# 🏫 Gestione Asilo

App web per la gestione di studenti e presenze di un asilo.

---

## 📁 Struttura del progetto

```
asilo-app/
├── backend/
│   ├── server.js        ← API Express + SQLite
│   ├── package.json
│   └── asilo.db         ← creato automaticamente al primo avvio
│
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── App.css
    │   ├── main.jsx
    │   └── components/
    │       ├── StudenteCard.jsx
    │       ├── ModaleAggiungiStudente.jsx
    │       ├── ModalePresenza.jsx
    │       └── ModaleStorico.jsx
    ├── index.html
    ├── package.json
    └── vite.config.js
```

---

## 🚀 Come avviare il progetto

### Prerequisiti
- **Node.js** versione 18 o superiore → https://nodejs.org/

### 1. Avvia il Backend

Apri un terminale e vai nella cartella backend:

```bash
cd asilo-app/backend
npm install
npm start
```

✅ Il server sarà attivo su **http://localhost:3001**  
✅ Il database `asilo.db` verrà creato automaticamente

### 2. Avvia il Frontend

Apri un **secondo terminale** e vai nella cartella frontend:

```bash
cd asilo-app/frontend
npm install
npm run dev
```

✅ L'app sarà aperta su **http://localhost:5173**

---

## 🔧 Sviluppo con hot-reload

Per il backend con riavvio automatico a ogni modifica:

```bash
cd backend
npm run dev    # usa nodemon
```

---

## 📡 API Backend disponibili

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | /api/studenti | Lista tutti gli studenti |
| POST | /api/studenti | Aggiunge studente |
| DELETE | /api/studenti/:id | Elimina studente |
| POST | /api/studenti/:id/ore | Aggiunge ore credito |
| GET | /api/presenze/:studente_id | Storico presenze |
| POST | /api/presenze/ingresso | Registra ingresso |
| POST | /api/presenze/uscita | Registra uscita |

---

## 💡 Note tecniche

- Il database SQLite (`asilo.db`) viene salvato nella cartella `backend/`
- Le ore vengono arrotondate a 2 decimali
- Le ore residue non scendono mai sotto 0
- Non è possibile registrare un secondo ingresso senza prima registrare l'uscita
