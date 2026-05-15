document.addEventListener('DOMContentLoaded', () => {
    const analyzeBtn = document.getElementById('analyze-btn');
    const resetBtn = document.getElementById('reset-btn');
    const exampleBtn = document.getElementById('example-btn');
    const textInput = document.getElementById('text-input');
    const charCount = document.getElementById('char-count');
    
    const loading = document.getElementById('loading');
    const errorBox = document.getElementById('error-box');
    const errorMessage = document.getElementById('error-message');
    
    const resultCard = document.getElementById('result-card');
    const detailCard = document.getElementById('detail-card');
    const sentimentLabel = document.getElementById('sentiment-label');
    const confidenceBadge = document.getElementById('confidence-badge');
    const reasonText = document.getElementById('reason-text');
    
    // Ratios
    const ratioPosVal = document.getElementById('ratio-pos-val');
    const ratioNeuVal = document.getElementById('ratio-neu-val');
    const ratioNegVal = document.getElementById('ratio-neg-val');
    const ratioPosBar = document.getElementById('ratio-pos-bar');
    const ratioNeuBar = document.getElementById('ratio-neu-bar');
    const ratioNegBar = document.getElementById('ratio-neg-bar');
    
    // AI Content
    const aiComment = document.getElementById('ai-comment');
    const tagsContainer = document.getElementById('tags-container');
    const highlightsContainer = document.getElementById('highlights-container');
    
    // Details
    const detailEmotion = document.getElementById('detail-emotion');
    const detailIntensity = document.getElementById('detail-intensity');
    const detailTone = document.getElementById('detail-tone');
    const detailExpression = document.getElementById('detail-expression');
    
    // History
    const historyList = document.getElementById('history-list');
    const clearHistoryBtn = document.getElementById('clear-history');

    // 1. Character Count
    textInput.addEventListener('input', () => {
        const length = textInput.value.length;
        charCount.textContent = `${length} / 1000`;
        if (length >= 1000) charCount.style.color = 'var(--error)';
        else charCount.style.color = '#444';
    });

    // 2. Reset Button
    resetBtn.addEventListener('click', () => {
        textInput.value = '';
        charCount.textContent = '0 / 1000';
        hideResult();
    });

    // 3. Example Button
    exampleBtn.addEventListener('click', () => {
        const examples = [
            "오랜만에 친구들을 만나서 정말 즐거운 시간을 보냈어. 마음이 따뜻해지는 하루야.",
            "분명 잘 될 거라고 믿었는데 결과가 이래서 너무 허무하고 속상해. 혼자 있고 싶다.",
            "그냥 평범한 하루였어. 특별한 일은 없었지만 나름대로 평화로운 느낌이야.",
            "밤새 내리는 빗소리를 들으며 옛 추억에 젖어드니 그리움과 후회가 밀려온다."
        ];
        textInput.value = examples[Math.floor(Math.random() * examples.length)];
        textInput.dispatchEvent(new Event('input'));
    });

    // 4. Analyze Button
    analyzeBtn.addEventListener('click', async () => {
        const text = textInput.value.trim();

        if (!text) {
            showError('분석할 문장을 입력해 주세요.');
            return;
        }

        hideError();
        hideResult();
        setLoading(true);

        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || '분석 중 오류가 발생했습니다.');
            }

            displayResult(data);
            saveToHistory(text, data);
        } catch (error) {
            console.error('Error:', error);
            showError(error.message);
        } finally {
            setLoading(false);
        }
    });

    function setLoading(isLoading) {
        if (isLoading) {
            analyzeBtn.disabled = true;
            analyzeBtn.textContent = '깊게 읽는 중...';
            loading.classList.remove('hidden');
        } else {
            analyzeBtn.disabled = false;
            analyzeBtn.textContent = '분석하기';
            loading.classList.add('hidden');
        }
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorBox.classList.remove('hidden');
        window.scrollTo({ top: errorBox.offsetTop - 100, behavior: 'smooth' });
    }

    function hideError() {
        errorBox.classList.add('hidden');
    }

    function displayResult(data) {
        const sentimentMap = { 'positive': '긍정', 'negative': '부정', 'neutral': '중립' };
        
        sentimentLabel.textContent = sentimentMap[data.sentiment] || '알 수 없음';
        sentimentLabel.style.color = `var(--${data.sentiment})`;
        confidenceBadge.textContent = `${data.confidence}%`;
        reasonText.textContent = data.reason;

        // Ratios with animation delay
        ratioPosVal.textContent = `${data.ratios.positive}%`;
        ratioNeuVal.textContent = `${data.ratios.neutral}%`;
        ratioNegVal.textContent = `${data.ratios.negative}%`;
        
        setTimeout(() => {
            ratioPosBar.style.width = `${data.ratios.positive}%`;
            ratioNeuBar.style.width = `${data.ratios.neutral}%`;
            ratioNegBar.style.width = `${data.ratios.negative}%`;
        }, 100);

        // AI Comment & Keywords
        aiComment.textContent = data.comment;
        tagsContainer.innerHTML = '';
        data.keywords.forEach(kw => {
            const span = document.createElement('span');
            span.className = 'tag';
            span.textContent = kw;
            tagsContainer.appendChild(span);
        });

        // Highlights
        highlightsContainer.innerHTML = '';
        if (data.highlights && data.highlights.length > 0) {
            data.highlights.forEach(item => {
                const div = document.createElement('div');
                div.className = `highlight-item ${item.sentiment}`;
                div.innerHTML = `
                    <span class="highlight-text">"${item.text}"</span>
                    <span class="highlight-tag">${sentimentMap[item.sentiment]}</span>
                `;
                highlightsContainer.appendChild(div);
            });
        }

        // Details
        detailEmotion.textContent = data.details.primaryEmotion;
        detailIntensity.textContent = data.details.intensity;
        detailTone.textContent = data.details.tone;
        detailExpression.textContent = data.details.expression;

        resultCard.classList.remove('hidden');
        detailCard.classList.remove('hidden');
        
        window.scrollTo({ top: resultCard.offsetTop - 50, behavior: 'smooth' });
    }

    function hideResult() {
        resultCard.classList.add('hidden');
        detailCard.classList.add('hidden');
        
        // Reset bars
        ratioPosBar.style.width = '0';
        ratioNeuBar.style.width = '0';
        ratioNegBar.style.width = '0';
    }

    // 5. History Management
    function saveToHistory(text, data) {
        const history = JSON.parse(localStorage.getItem('sentiment_history') || '[]');
        const newItem = {
            id: Date.now(),
            date: new Date().toLocaleString(),
            text: text,
            sentiment: data.sentiment,
            confidence: data.confidence
        };
        history.unshift(newItem);
        localStorage.setItem('sentiment_history', JSON.stringify(history.slice(0, 5)));
        renderHistory();
    }

    function renderHistory() {
        const history = JSON.parse(localStorage.getItem('sentiment_history') || '[]');
        if (history.length === 0) {
            historyList.innerHTML = '<p class="empty-msg">최근 분석 기록이 없습니다.</p>';
            return;
        }

        const sentimentMap = { 'positive': '긍정', 'negative': '부정', 'neutral': '중립' };
        historyList.innerHTML = history.map(item => `
            <div class="history-item" onclick="loadHistoryItem('${item.id}')">
                <div class="history-info">
                    <span class="history-date">${item.date}</span>
                    <span class="history-text">"${item.text}"</span>
                </div>
                <div class="history-right">
                    <div class="history-result">
                        <span class="history-sentiment" style="color: var(--${item.sentiment})">${sentimentMap[item.sentiment]}</span>
                        <span class="history-conf">${item.confidence}%</span>
                    </div>
                    <button class="btn-delete" onclick="deleteHistoryItem(event, '${item.id}')">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
            </div>
        `).join('');
    }

    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', () => {
            if (confirm('모든 기록을 삭제하시겠습니까?')) {
                localStorage.removeItem('sentiment_history');
                renderHistory();
            }
        });
    }

    window.deleteHistoryItem = (event, id) => {
        event.stopPropagation(); // Prevent loading the item
        let history = JSON.parse(localStorage.getItem('sentiment_history') || '[]');
        history = history.filter(item => item.id != id);
        localStorage.setItem('sentiment_history', JSON.stringify(history));
        renderHistory();
    };

    window.loadHistoryItem = (id) => {
        const history = JSON.parse(localStorage.getItem('sentiment_history') || '[]');
        const item = history.find(h => h.id == id);
        if (item) {
            textInput.value = item.text;
            textInput.dispatchEvent(new Event('input'));
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    renderHistory();
});
