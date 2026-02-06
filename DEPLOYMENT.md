# Guide de Déploiement : Local & Hostinger

Ce projet utilise désormais une architecture **Fullstack** :
- **Frontend** : React (Vite)
- **Backend** : Node.js (Express)
- **Base de données** : SQLite (Local) / MySQL (Hostinger)

## 1. Environnement Local (Mac)

Le serveur backend tourne sur le port `3000`.
Le frontend tourne sur le port `8080`.

### Démarrer le projet
1. **Backend** : `node server/server.js`
2. **Frontend** : `npm run dev`

### Base de données Locale
Le fichier de base de données est `prisma/dev.db` (SQLite).
Pour voir les données, vous pouvez utiliser un outil comme **Prisma Studio** :
```bash
npx prisma studio
```

---

## 2. Déploiement sur Hostinger (VPS ou Cloud)

Pour passer en production sur Hostinger avec MySQL :

### Étape 1 : Préparer MySQL sur Hostinger
1. Créez une base de données MySQL sur votre panneau Hostinger.
2. Notez les identifiants (Hôte, Nom de base, Utilisateur, Mot de passe).

### Étape 2 : Configurer le projet
Dans votre fichier `.env` sur le serveur Hostinger (ne pas commiter le mot de passe !) :
Remplacer :
`DATABASE_URL="file:./dev.db"`
Par :
`DATABASE_URL="mysql://UTILISATEUR:MOT_DE_PASSE@HOST:3306/NOM_BASE_DE_DONNEES"`

### Étape 3 : Adapter le schéma Prisma
Dans `prisma/schema.prisma`, changez le provider :

```prisma
datasource db {
  provider = "mysql"  // <--- Changer "sqlite" en "mysql"
  url      = env("DATABASE_URL")
}
```

*Note : Les enums et certains types peuvent varier légèrement entre SQLite et MySQL, mais Prisma gère la plupart des différences.*

### Étape 4 : Déployer et Migrer
Sur le serveur Hostinger :
1. Installez les dépendances : `npm install`
2. Lancez les migrations pour créer les tables dans MySQL :
   ```bash
   npx prisma migrate deploy
   ```
3. Lancez le serveur :
   ```bash
   node server/server.js
   ```
   (Utilisez **PM2** pour le garder actif : `pm2 start server/server.js`)

## Résumé
- **Local** = SQLite (Simple, rapide, sans config)
- **Prod** = MySQL (Robuste, scalable)
- Le code Backend reste le même !
