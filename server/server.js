import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';

const app = express();
app.use(express.json({ limit: '20mb' }));

const _filename = fileURLToPath(import.meta.url);
const _dirname = path.dirname(_filename);
app.use(express.static(path.join(_dirname, '..', 'public')));

// const upload = multer({ storage: multer.memoryStorage() });
// Multer setup with basic guards
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB
    fileFilter: (_req, file, cb) => {
        const ok = ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype);
        cb(ok ? null : new Error('Only JPG, PNG, or WebP images are allowed'));
    }
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// --- Your C.R.A.F.T. prompt as a function so we can inject fields ---
function craftPrompt({ imageDataUrl, itemDescription }) {
    return `
Context:
You have been provided with an image or textual description of an item to be sold at auction. Your job is to create a full, professional auction listing—including title, category, condition report, provenance, detailed history, and persuasive copy—so bidders feel compelled to place competitive bids.

Role:
You are an industry-leading auction cataloguer and copywriter with 20+ years at top auction houses.

Action:
Analyze Input: Examine the provided Image and/or Item Description.

Generate Title & Category: Write a concise, SEO-friendly lot title and assign the most precise auction category.

Detail the Item:
- Physical Description: Materials, dimensions, maker’s marks, condition notes.
- Provenance & History: Ownership, date of manufacture, cultural/historical significance.
- Condition Report: Damage/restoration/unique wear, using industry-standard terminology.
- Persuasive Copy: 2–3 short paragraphs with (a) rarity/craft, (b) tasteful emotional angle, (c) a clear CTA.

Lot Details Block: Provide a neat bullet list or table for: lot number (use a placeholder if not provided), estimate (placeholder if unknown), auction date (placeholder), buyer’s premium (placeholder), shipping details.

Finalize: Proofread for tone consistency, factual accuracy, and keyword optimization.

Format:
- Produce the listing in Markdown:
  - H2 for the lot title
  - **Bold** labels for each section (Category, Dimensions, Condition, etc.)
  - A table or bulleted list for technical details
  - Persuasive copy in plain paragraphs

Target Audience:
Collectors, designers, investors; value authenticity, clear provenance, and excitement.

User Inputs:
- Item_Description: ${itemDescription || '(none provided)'}
- Image_URL: (see attached image below)
`.trim();
}

// POST /generate accepts an image upload + optional description
app.post('/generate', upload.single('image'), async (req, res) => {
    try {
        const description = req.body.description || '';
        let dataUrl = null;

        if (req.file) {
            const mime = req.file.mimetype || 'image/jpeg';
            const b64 = req.file.buffer.toString('base64');
            dataUrl = `data:${mime};base64,${b64}`;
        }

        if (!dataUrl && !description) {
            return res.status(400).json({ error: 'Provide an image or a description.' });
        }

        const systemPreamble = "You are a meticulous auction cataloguer. Output strictly in Markdown as requested.";
        const userPrompt = craftPrompt({ imageDataUrl: dataUrl, itemDescription: description });

        // Responses API request (text + image)
        // Docs: OpenAI Responses + Images/Vision guides. :contentReference[oaicite:0]{index=0}
        const response = await openai.responses.create({
            model: "gpt-4o", // or "o4-mini" for cheaper/faster. :contentReference[oaicite:1]{index=1}
            input: [
                {
                    role: "system",
                    content: [{ type: "input_text", text: systemPreamble }]
                },
                {
                    role: "user",
                    content: [
                        { type: "input_text", text: userPrompt },
                        ...(dataUrl ? [{ type: "input_image", image_url: dataUrl }] : [])
                    ]
                }
            ]
        });

        // Pull the text out (guard for SDK shapes)
        const text =
            response.output_text ??
            response.output?.[0]?.content?.[0]?.text ??
            JSON.stringify(response, null, 2);

        res.json({ markdown: text });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err?.message || 'Unexpected error' });
    }
});

const PORT = process.env.PORT || 8787;
app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));