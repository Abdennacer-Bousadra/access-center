# Access Center

Site vitrine et plateforme de formation du centre **ACCESS CENTER** (Loudaya, Marrakech) : 14 formations et 15 services, avec comptes utilisateurs, cours en ligne protégés et panneau d'administration.

Site en ligne : https://accesscenter.ma

## Stack

- **Frontend :** React 18 + Vite + Tailwind CSS, FR / AR / EN
- **Backend :** Node.js + Express 5 + MySQL (`mysql2`)
- **Auth :** sessions par cookie HttpOnly, vérification par e-mail (nodemailer), bcrypt, protection CSRF et limitation de débit

## Lancer le projet

```bash
npm install
cp .env.example .env   # puis remplir les variables (base de données, SMTP, secret de session)
npm run db:migrate
npm run db:seed
npm run dev            # frontend Vite sur http://localhost:5173
npm run server         # API Express sur http://localhost:5000
```

Autres scripts : `npm run dev:server`, `npm run db:seed:informatique`, `npm run create-admin`, `npm run build`, `npm run preview`.

## Structure

- `src/` — application React (pages, composants, contextes, i18n)
- `server/` — API Express (routes, middlewares, base de données MySQL)
- `public/` — fichiers statiques
