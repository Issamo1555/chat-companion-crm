import axios from 'axios';

const PORT = 5000;
const WEBHOOK_URL = `http://localhost:${PORT}/api/webhooks/meta`;

const simulateMetaMessage = async (platform: 'instagram' | 'page') => {
    const payload = {
        object: platform,
        entry: [{
            id: platform === 'instagram' ? '123456789_insta' : '987654321_fb',
            time: Date.now(),
            messaging: [{
                sender: { id: `user_${Math.floor(Math.random() * 1000)}` },
                recipient: { id: platform === 'instagram' ? '123456789_insta' : '987654321_fb' },
                timestamp: Date.now(),
                message: { text: `Message de test pour ${platform} à ${new Date().toLocaleTimeString()}` }
            }]
        }]
    };

    try {
        console.log(`Envoi d'un message simulé pour ${platform === 'instagram' ? 'Instagram' : 'Messenger'}...`);
        await axios.post(WEBHOOK_URL, payload);
        console.log("✅ Simulation réussie !");
    } catch (error: any) {
        console.error(`❌ Erreur: ${error.response?.data?.message || error.message}`);
    }
};

async function run() {
    await simulateMetaMessage('instagram');
    await new Promise(r => setTimeout(r, 1000));
    await simulateMetaMessage('page');
}

run();
