# FROM TEXT TO FEELING

AI 기반 텍스트 감성 분석 서비스입니다. 사용자가 입력한 문장의 감성(긍정, 부정, 중립)을 분석하고 그 이유와 신뢰도를 제공합니다.

## 주요 기능
- **감성 분석**: OpenAI GPT-4o-mini 모델을 사용하여 텍스트 감성 분석.
- **결과 시각화**: 분석 결과(감성, 신뢰도, 이유)를 직관적인 카드 형태로 표시.
- **기록 저장**: 분석된 데이터를 Supabase DB에 실시간으로 저장.
- **반응형 디자인**: 모바일과 데스크톱 모두에서 최적화된 UI 제공.

## 기술 스택
- **Frontend**: HTML5, CSS3 (Vanilla), JavaScript (Vanilla)
- **Backend**: Node.js, Express
- **AI/DB**: OpenAI API, Supabase

## 설치 및 실행 방법

1. **의존성 설치**
   ```bash
   npm install
   ```

2. **환경 변수 설정**
   `.env` 파일을 생성하고 아래 항목을 입력하세요:
   ```env
   OPENAI_API_KEY=your_openai_api_key
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   PORT=3000
   ```

3. **로컬 실행**
   ```bash
   npm run dev
   ```

## DB 스키마 (Supabase)
`sentiment_logs` 테이블을 아래와 같이 생성하세요:
```sql
create table sentiment_logs (
  id uuid primary key default gen_random_uuid(),
  input_text text not null,
  sentiment text not null check (sentiment in ('positive', 'negative', 'neutral')),
  confidence integer not null check (confidence >= 0 and confidence <= 100),
  reason text not null,
  created_at timestamptz not null default now()
);
```

## 완료 기준 및 검증
- [x] HTML/CSS/JS 기본 화면 구현 완료
- [x] Express 서버 및 API 엔드포인트 구현 완료
- [x] OpenAI API 연동 및 데이터 정규화 완료
- [x] Supabase 데이터 로깅 기능 추가 완료
- [x] 오류 처리 및 예외 상황 대응 완료
