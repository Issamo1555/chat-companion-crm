import express from 'express';
import cors from 'cors';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
// robustly load the generated client directly
const { PrismaClient } = require('../node_modules/.prisma/client/index.js');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Users API
app.get('/api/users', async (req, res) => {
    try {
        const users = await prisma.user.findMany();
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Clients API
app.get('/api/clients', async (req, res) => {
    try {
        const clients = await prisma.client.findMany({
            include: {
                assignedAgent: true,
                tags: { include: { tag: true } },
            },
            orderBy: { updatedAt: 'desc' }
        });
        res.json(clients);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch clients' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
