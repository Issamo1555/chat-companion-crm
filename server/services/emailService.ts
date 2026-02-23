import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';

const prisma = new PrismaClient();

export class EmailService {
    /**
     * Send an email using SMTP
     */
    async sendEmail(emailAccountId: string, to: string, subject: string, content: string, html?: string) {
        const account = await prisma.emailAccount.findUnique({
            where: { id: emailAccountId }
        });

        if (!account) throw new Error('Email account not found');

        const transporter = nodemailer.createTransport({
            host: account.smtpHost,
            port: account.smtpPort,
            secure: account.smtpSecure,
            auth: {
                user: account.smtpUser,
                pass: account.smtpPass
            }
        });

        const from = account.name ? `"${account.name}" <${account.email}>` : account.email;

        const info = await transporter.sendMail({
            from,
            to,
            subject,
            text: content,
            html: html || content
        });

        // Try to find client by toAddress to link the sent email
        const clientRecord = await prisma.client.findFirst({
            where: { email: to }
        });

        // Save to Sent folder
        const savedMessage = await prisma.emailMessage.create({
            data: {
                emailAccountId,
                clientId: clientRecord?.id,
                fromAddress: account.email,
                fromName: account.name,
                toAddress: to,
                subject,
                body: content,
                html: html,
                folder: 'sent',
                isRead: true,
                messageId: info.messageId,
                date: new Date()
            }
        });

        return savedMessage;
    }

    /**
     * Poll for new emails via IMAP
     */
    async pollEmails(emailAccountId: string) {
        let client: ImapFlow | null = null;
        try {
            const account = await prisma.emailAccount.findUnique({
                where: { id: emailAccountId }
            });

            if (!account) throw new Error('Email account not found');

            client = new ImapFlow({
                host: account.imapHost,
                port: account.imapPort,
                secure: account.imapSecure,
                auth: {
                    user: account.imapUser,
                    pass: account.imapPass
                },
                logger: false
            });

            await client.connect();

            let lock = await client.getMailboxLock('INBOX');
            try {
                // Fetch unread messages
                for await (let msg of client.fetch({ seen: false }, { source: true, envelope: true })) {
                    try {
                        if (!msg.source) continue;
                        const parsed = await simpleParser(msg.source);
                        const messageId = parsed.messageId || `gen-${Date.now()}-${Math.random()}`;

                        // Check if messageId already exists to avoid duplicates
                        const existing = await prisma.emailMessage.findUnique({
                            where: { messageId: messageId }
                        });

                        if (existing) continue;

                        // Match with client
                        const fromEmail = parsed.from?.value[0]?.address;
                        const clientRecord = fromEmail ? await prisma.client.findFirst({
                            where: { email: { equals: fromEmail } }
                        }) : null;

                        await prisma.emailMessage.create({
                            data: {
                                emailAccountId,
                                clientId: clientRecord?.id,
                                messageId: messageId,
                                fromAddress: fromEmail || 'unknown',
                                fromName: parsed.from?.value[0]?.name,
                                toAddress: account.email,
                                subject: parsed.subject || '(No Subject)',
                                body: parsed.text || '',
                                html: parsed.textAsHtml || (parsed.html as string) || '',
                                folder: 'inbox',
                                isRead: false,
                                date: parsed.date || new Date()
                            }
                        });

                        // Optionally mark as seen on server
                        // await client.messageFlagsAdd({uid: msg.uid}, ['\\Seen']);
                    } catch (err) {
                        console.error('Error parsing individual email:', err);
                    }
                }
            } finally {
                lock.release();
            }
        } catch (error) {
            console.error('IMAP Polling error:', error);
            throw error;
        } finally {
            if (client) {
                await client.logout();
            }
        }
    }

    /**
     * Start a background job to poll all accounts periodically
     */
    startPolling(intervalMs: number = 300000) { // Default 5 minutes
        setInterval(async () => {
            const accounts = await prisma.emailAccount.findMany();
            for (const account of accounts) {
                try {
                    await this.pollEmails(account.id);
                } catch (err) {
                    console.error(`Failed to poll account ${account.email}:`, err);
                }
            }
        }, intervalMs);
    }
}

export const emailService = new EmailService();
