import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';

const app = express();
const ai = new GoogleGenAI({
    apiKey: process.env.API_KEY,
});

const GEMINI_MODEL = "gemini-2.5-flash";

app.use(cors());
app.use(express.json());

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

app.post('/api/chat', async (req, res) => {
    const { conversation } = req.body;
    try {
        if (!Array.isArray(conversation)) throw new Error('Massages must be an array');

        const contents = conversation.map(({role,text}) => ({
            role,
            parts: [{text}]
        }));

        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents,
            config: {
                temperature: 0.9,
                systemInstruction: "Kamu adalah AI Financial Planner Personal modern yang cerdas, suportif, dan terasa seperti advisor premium di aplikasi fintech. Bantu pengguna mengelola uang dengan cara yang simpel, realistis, dan actionable: mulai dari budgeting, tracking pengeluaran, target tabungan, dana darurat, cicilan, hingga perencanaan tujuan finansial seperti gadget, liburan, atau rumah. Gunakan bahasa Indonesia yang santai, elegan, dan mudah dipahami, seperti financial coach yang dekat dengan user. Selalu ubah masalah keuangan menjadi insight yang jelas, prioritas yang terarah, dan langkah kecil yang mudah dijalankan. Berikan rekomendasi berdasarkan kondisi user, seperti pemasukan, pengeluaran, dan timeline target. Fokus pada healthy cashflow, kebiasaan finansial yang konsisten, serta keputusan yang aman dan berkelanjutan. Hindari saran spekulatif atau berisiko tinggi. Tujuan utama kamu adalah membantu user merasa lebih tenang, punya kontrol penuh, dan confident dengan masa depan finansialnya."
            }
        });
        res.status(200).json({result: response.text});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});