import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export const aiService = {
    /**
     * Generates a draft for an email based on context and intent.
     */
    async generateEmailDraft(params: {
        toName?: string;
        subject?: string;
        context?: string;
        intent: string;
        tone?: 'professional' | 'friendly' | 'urgent';
    }) {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY is not configured");
        }

        const prompt = `
      Tu es un assistant IA intégré à un CRM. 
      Rédige un email ${params.tone || 'professionnel'} en français basé sur les informations suivantes :
      - Destinataire : ${params.toName || 'Client'}
      - Sujet (si disponible) : ${params.subject || 'N/A'}
      - Contexte de la conversation précédente : ${params.context || 'Aucun contexte'}
      - Ce que l'agent veut dire (intention) : ${params.intent}

      Réponds uniquement avec le corps de l'email (pas de sujet, pas de blabla introduction). 
      Utilise un ton adapté et assure-toi que le français est parfait.
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text().trim();
    },

    /**
     * Summarizes an email or a thread.
     */
    async summarizeEmail(subject: string, body: string) {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY is not configured");
        }

        const prompt = `
      Résumé moi cet email de manière concise (max 3-4 puces) en français.
      Sujet : ${subject}
      Contenu : ${body}
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text().trim();
    }
};
