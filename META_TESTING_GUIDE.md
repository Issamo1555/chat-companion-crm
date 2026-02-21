# Guide de Test - Instagram & Messenger

Pour tester l'intégration, vous avez deux options : le test réel (via Meta) ou la simulation locale (pour développement).

## 1. Configuration Meta (Test Réel)

### Pré-requis
- Un compte **Meta for Developers**.
- Une **Page Facebook** liée à un compte **Instagram Business**.
- Une Application Meta de type **"Business"**.

### Étapes
1.  **Produit Messenger/Instagram** : Ajoutez les produits "Messenger" et "Instagram Graph API" à votre app.
2.  **Tokens** : Générez un "Page Access Token" dans le tableau de bord Meta.
3.  **Webhooks** : 
    - URL de rappel : `https://votre-domaine.com/api/webhooks/meta`
    - Token de vérification : (Ex: `my_verify_token_123`)
    - Champs à s'abonner : `messages`, `messaging_postbacks`, `instagram_manage_messages`.
4.  **Variables d'environnement** : Mettez à jour votre `.env` :
    ```env
    META_ACCESS_TOKEN=votre_token_ici
    META_VERIFY_TOKEN=my_verify_token_123
    ```

---

## 2. Simulation Locale (Sans Meta)

Si vous n'avez pas encore configuré Meta, vous pouvez simuler une réception de message en envoyant une requête `POST` à votre serveur local.

### Script de Simulation (Node.js)
Créez un fichier `scripts/simulate-meta.ts` :

```typescript
import axios from 'axios';

const PORT = 5000;
const WEBHOOK_URL = `http://localhost:${PORT}/api/webhooks/meta`;

const simulateInstagramMessage = async () => {
    const payload = {
        object: 'instagram',
        entry: [{
            id: 'INSTA_PAGE_ID',
            time: Date.now(),
            messaging: [{
                sender: { id: 'INSTA_USER_ID' },
                recipient: { id: 'INSTA_PAGE_ID' },
                timestamp: Date.now(),
                message: { text: "Bonjour depuis Instagram !" }
            }]
        }]
    };

    try {
        await axios.post(WEBHOOK_URL, payload);
        console.log("✅ Message Instagram simulé avec succès !");
    } catch (error) {
        console.error("❌ Erreur simulation Instagram:", error.message);
    }
};

simulateInstagramMessage();
```

### Exécution
```bash
npx ts-node scripts/simulate-meta.ts
```

---

## 3. Vérification dans le CRM
1. Connectez-vous au CRM.
2. Allez dans l'onglet **Messenger** ou **Instagram** dans la barre latérale.
3. Le nouveau message simulé devrait apparaître dans la liste des conversations avec l'icône appropriée.
