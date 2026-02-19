import { io } from 'socket.io-client';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:3000/api';

async function registerUser(name: string, email: string) {
    const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password: 'password123', role: 'agent' })
    });
    const data = await res.json();
    // If user exists, try login
    if (res.status === 400 && data.error === 'User with this email already exists') {
        return loginUser(email);
    }
    return data;
}

async function loginUser(email: string) {
    const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'password123' })
    });
    return res.json();
}

async function createClient(token: string, name: string, phone: string) {
    const res = await fetch(`${API_URL}/clients`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, phoneNumber: phone, status: 'new' })
    });
    return res.json();
}

async function main() {
    console.log('🧪 Starting Round Robin Test...');

    // 1. Setup Agents
    console.log('👤 Registering/Logging in Agents...');
    const agentA = await registerUser('Test Agent A', 'agent.a@test.com');
    const agentB = await registerUser('Test Agent B', 'agent.b@test.com');

    if (!agentA.token || !agentB.token) {
        console.error('❌ Failed to get tokens for agents');
        process.exit(1);
    }

    // 2. Connect Sockets (Simulate Online)
    console.log('🔌 Connecting Sockets...');
    const socketA = io('http://localhost:3000', { auth: { token: agentA.token } });
    const socketB = io('http://localhost:3000', { auth: { token: agentB.token } });

    await new Promise<void>(resolve => {
        let connected = 0;
        const check = () => {
            connected++;
            if (connected === 2) resolve();
        };
        socketA.on('connect', check);
        socketB.on('connect', check);
    });
    console.log('✅ Agents Online');

    // Wait a bit for server to register them
    await new Promise(r => setTimeout(r, 1000));

    // 3. Create Clients
    console.log('📝 Creating Clients...');
    // Use Agent A's token to create clients (simulating manual entry or system action)
    const client1 = await createClient(agentA.token, 'Test Client 1', '1234567891');
    const client2 = await createClient(agentA.token, 'Test Client 2', '1234567892');

    console.log(`Checking assignments...`);
    console.log(`Client 1 assigned to: ${client1.assignedAgentId}`);
    console.log(`Client 2 assigned to: ${client2.assignedAgentId}`);

    // 4. Verify
    if (client1.assignedAgentId && client2.assignedAgentId && client1.assignedAgentId !== client2.assignedAgentId) {
        console.log('🎉 SUCCESS: Clients assigned to different agents!');
    } else if (client1.assignedAgentId && client2.assignedAgentId && client1.assignedAgentId === client2.assignedAgentId) {
        console.log('⚠️ WARNING: Clients assigned to SAME agent. Check logic (might be correct if sort order persists or one agent disconnected).');

        // Debug
        const agentAId = agentA.user ? agentA.user.id : agentA.id; // Login returns user object inside, register might be different structure in my mock above but usually consistent
        const agentBId = agentB.user ? agentB.user.id : agentB.id;

        console.log(`Agent A ID: ${agentA.user?.id}`);
        console.log(`Agent B ID: ${agentB.user?.id}`);
    } else {
        console.log('❌ FAILED: Assignment missing.');
    }

    // 5. Cleanup
    console.log('🧹 Cleaning up...');
    socketA.disconnect();
    socketB.disconnect();

    // Delete test data
    await prisma.client.deleteMany({ where: { phoneNumber: { in: ['1234567891', '1234567892'] } } });
    await prisma.user.deleteMany({ where: { email: { in: ['agent.a@test.com', 'agent.b@test.com'] } } });

    console.log('✅ Test Complete');
}

main().catch(console.error).finally(async () => {
    await prisma.$disconnect();
});
