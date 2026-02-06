# BEQ CRM WhatsApp

Application de gestion de relation client (CRM) avec intégration WhatsApp.

## Technologies utilisées

Ce projet est construit avec :

- **Vite** - Build tool rapide
- **TypeScript** - Typage statique
- **React** - Framework UI
- **shadcn-ui** - Composants UI
- **Tailwind CSS** - Framework CSS
- **Prisma** - ORM pour base de données
- **Express** - Serveur backend
- **Baileys** - Intégration WhatsApp
- **Socket.io** - Communication temps réel

## Installation

### Prérequis

- Node.js (version 18 ou supérieure)
- npm ou bun

### Étapes d'installation

```sh
# 1. Cloner le repository
git clone <YOUR_GIT_URL>

# 2. Naviguer dans le répertoire du projet
cd beq-crm-whatsup

# 3. Installer les dépendances
npm install

# 4. Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos configurations

# 5. Initialiser la base de données
npx prisma migrate dev
npx prisma db seed

# 6. Démarrer le serveur de développement
npm run dev

# 7. Dans un autre terminal, démarrer le serveur backend
npm run start:server
```

## Scripts disponibles

- `npm run dev` - Démarre le serveur de développement frontend (port 8080)
- `npm run start:server` - Démarre le serveur backend Express
- `npm run build` - Compile le projet pour la production
- `npm run preview` - Prévisualise la version de production
- `npm test` - Lance les tests
- `npm run lint` - Vérifie le code avec ESLint

## Structure du projet

```
beq-crm-whatsup/
├── src/                    # Code source frontend
│   ├── components/         # Composants React
│   ├── pages/             # Pages de l'application
│   ├── contexts/          # Contextes React
│   └── types/             # Types TypeScript
├── server/                # Code serveur backend
├── prisma/                # Schéma et migrations de base de données
├── database/              # Scripts SQL
└── public/                # Fichiers statiques
```

## Fonctionnalités

- 📊 Dashboard avec statistiques en temps réel
- 💬 Intégration WhatsApp pour la messagerie
- 👥 Gestion des clients et agents
- 📈 Graphiques de performance
- 🔐 Authentification sécurisée
- 📝 Logs d'activité
- ⚙️ Paramètres configurables

## Déploiement

Consultez le fichier `DEPLOYMENT.md` pour les instructions de déploiement.

## Licence

Propriétaire - BEQ
