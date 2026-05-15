document.addEventListener('DOMContentLoaded', () => {
    const analyzeBtn = document.getElementById('analyze-btn');
    const textInput = document.getElementById('text-input');
    const loading = document.getElementById('loading');
    const errorBox = document.getElementById('error-box');
    const errorMessage = document.getElementById('error-message');
    const resultCard = document.getElementById('result-card');
    const sentimentLabel = document.getElementById('sentiment-label');
    const confidenceBadge = document.getElementById('confidence-badge');
    const reasonText = document.getElementById('reason-text');

    analyzeBtn.addEventListener('click', async () => {
        const text = textInput.value.trim();

        // 1. Validation
        if (!text) {
            showError('분석할 문장을 입력해 주세요.');
            return;
        }

        if (text.length > 1000) {
            showError('문장은 최대 1000자까지 입력 가능합니다.');
            return;
        }

        // 2. Prepare UI
        hideError();
        hideResult();
        setLoading(true);

        try {
            // 3. API Request
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || '분석 중 오류가 발생했습니다.');
            }

            // 4. Show Result
            displayResult(data);
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
            analyzeBtn.textContent = '분석 중...';
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
        const sentimentMap = {
            'positive': '긍정',
            'negative': '부정',
            'neutral': '중립'
        };

        sentimentLabel.textContent = sentimentMap[data.sentiment] || '알 수 없음';
        confidenceBadge.textContent = `${data.confidence}%`;
        reasonText.textContent = data.reason;

        // Add dynamic color based on sentiment
        sentimentLabel.style.color = `var(--${data.sentiment})`;

        resultCard.classList.remove('hidden');
        window.scrollTo({ top: resultCard.offsetTop - 100, behavior: 'smooth' });
    }

    function hideResult() {
        resultCard.classList.add('hidden');
    }
});
