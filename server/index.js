require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Initialize OpenAI
let openai;
try {
    openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY || 'missing',
    });
} catch (e) {
    console.error('OpenAI Initialization Error:', e.message);
}

// Initialize Supabase
let supabase;
if (process.env.SUPABASE_URL && process.env.SUPABASE_URL.startsWith('http')) {
    supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
    );
} else {
    console.warn('Supabase URL is missing or invalid. Logging will be disabled.');
}

// API Endpoints
app.post('/api/analyze', async (req, res) => {
    const { text } = req.body;

    // 1. Validation
    if (!text || typeof text !== 'string' || text.trim() === '') {
        return res.status(400).json({ error: '분석할 텍스트를 입력해 주세요.' });
    }

    if (text.length > 1000) {
        return res.status(400).json({ error: '텍스트는 최대 1000자까지 가능합니다.' });
    }

    try {
        // 2. OpenAI Analysis
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini", // Using a cost-effective and fast model
            messages: [
                {
                    role: "system",
                    content: `너는 한국어 텍스트 감성 분석기다. 
                    사용자 텍스트를 positive, negative, neutral 중 하나로 분류한다. 
                    confidence는 0부터 100 사이의 정수로 작성한다. 
                    reason은 한국어로 한 문장만 작성한다. 
                    과장하지 말고 텍스트 근거만 사용한다.
                    응답은 반드시 아래 JSON 형식을 지켜야 한다:
                    {
                        "sentiment": "positive | negative | neutral",
                        "confidence": number,
                        "reason": "string"
                    }`
                },
                {
                    role: "user",
                    content: text
                }
            ],
            response_format: { type: "json_object" }
        });

        const result = JSON.parse(response.choices[0].message.content);

        // 3. Supabase Logging (Non-blocking)
        // We don't await this to ensure fast response to the user
        logToSupabase(text, result).catch(err => console.error('Supabase Log Error:', err));

        // 4. Return Result
        res.json(result);

    } catch (error) {
        console.error('Analysis Error:', error);
        res.status(500).json({ error: '분석 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.' });
    }
});

async function logToSupabase(inputText, result) {
    if (!supabase) {
        console.warn('Supabase not initialized. Skipping log.');
        return;
    }
    const { data, error } = await supabase
        .from('sentiment_logs')
        .insert([
            {
                input_text: inputText,
                sentiment: result.sentiment,
                confidence: result.confidence,
                reason: result.reason
            }
        ]);
    
    if (error) throw error;
    return data;
}

// Fallback to index.html for SPA-like behavior (if needed)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;
