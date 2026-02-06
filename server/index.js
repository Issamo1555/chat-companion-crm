"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const client_1 = require("@prisma/client");
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
const PORT = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Users API
app.get('/api/users', async (req, res) => {
    try {
        const users = await prisma.user.findMany();
        res.json(users);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});
app.post('/api/users', async (req, res) => {
    try {
        const user = await prisma.user.create({
            data: req.body,
        });
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create user' });
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
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch clients' });
    }
});
app.post('/api/clients', async (req, res) => {
    try {
        const client = await prisma.client.create({
            data: {
                ...req.body,
                updatedAt: new Date(),
            },
        });
        res.json(client);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create client' });
    }
});
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
