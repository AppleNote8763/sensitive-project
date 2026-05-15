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
                    content: `너는 한국어 텍스트 감성 분석기이자 심리 상담사다. 
                    사용자 텍스트를 분석하여 다음 정보를 JSON 형식으로 제공한다:

                    1. sentiment: 전체 감성 (positive | negative | neutral)
                    2. confidence: 분석 신뢰도 (0~100)
                    3. reason: 전체적인 분석 이유 (한 문장)
                    4. ratios: 긍정, 중립, 부정의 비율 (합계 100이 되어야 함)
                       { "positive": number, "neutral": number, "negative": number }
                    5. comment: AI의 감성적인 한줄 피드백 (예: "이 문장은 상실감과 고립감을 차분하게 표현하고 있습니다.")
                    6. keywords: 감정을 대표하는 단어들 (최대 4개, 예: ["상실감", "외로움", "후회"])
                    7. details: 상세 분석 데이터
                       { "primaryEmotion": "주요 감정", "intensity": "감정 강도", "tone": "문장 톤", "expression": "표현 방식" }
                    8. highlights: 감성 포인트 분석 (텍스트 내 주요 구절과 해당 감성)
                       [ { "text": "구절", "sentiment": "positive | negative | neutral" } ]

                    응답은 반드시 지정된 JSON 형식을 엄격히 지켜야 한다.`
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
