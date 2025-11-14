# AI Provider Setup Guide

This guide explains how to configure and switch between AI providers for recipe generation.

## Available Providers

### 1. Mock Provider (Development)
**Best for:** UI development, testing, demos without API costs

**Features:**
- No API key required
- Instant responses (1-2 second simulated delay)
- Returns realistic fake recipes
- Detects keywords in prompts (pasta, curry, salad, etc.)
- Respects user dietary preferences from profile
- 7 pre-built recipe templates

**Configuration:**
```env
AI_PROVIDER=mock
```

### 2. OpenRouter (Production)
**Best for:** Production use with multiple AI models

**Features:**
- Access to Claude, GPT-4, and other models
- Pay-per-use pricing
- Model flexibility
- Reliable API

**Configuration:**
```env
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=your_api_key_here
AI_MODEL=anthropic/claude-3.5-sonnet  # Optional, can customize
```

**Get API Key:**
1. Go to https://openrouter.ai/
2. Sign up and get API key
3. Add to your `.env` file

### 3. Google AI Studio (Production)
**Best for:** Production use with Google's Gemini models

**Features:**
- Access to Gemini models
- Competitive pricing
- Fast response times
- JSON mode support

**Configuration:**
```env
AI_PROVIDER=google
GOOGLE_API_KEY=your_api_key_here
AI_MODEL=gemini-1.5-flash  # Optional, defaults to flash
```

**Get API Key:**
1. Go to https://aistudio.google.com/
2. Sign in with Google account
3. Create API key
4. Add to your `.env` file

## How to Switch Providers

### Development → Production (Mock → Real AI)

**Step 1: Update `.env` file**

Change from:
```env
AI_PROVIDER=mock
```

To (for Google/Gemini):
```env
AI_PROVIDER=google
GOOGLE_API_KEY=your_actual_api_key_here
AI_MODEL=gemini-1.5-flash
```

Or (for OpenRouter):
```env
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=your_actual_api_key_here
AI_MODEL=anthropic/claude-3.5-sonnet
```

**Step 2: Restart development server**
```bash
npm run dev
```

**Step 3: Test the endpoint**
```bash
curl -X POST http://localhost:4321/api/recipes/generate \
  -H "Authorization: Bearer YOUR_SUPABASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "quick pasta recipe"}'
```

### Switching Between Real Providers

To switch from Google to OpenRouter (or vice versa):

1. Update `AI_PROVIDER` in `.env`
2. Set the appropriate API key
3. Optionally set model (each provider has different model names)
4. Restart server

**Example - Google to OpenRouter:**
```env
# Before
AI_PROVIDER=google
GOOGLE_API_KEY=abc123
AI_MODEL=gemini-1.5-flash

# After
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=xyz789
AI_MODEL=anthropic/claude-3.5-sonnet
```

## Optional Configuration

### Timeout Settings
Control how long to wait for AI response (milliseconds):
```env
AI_TIMEOUT_MS=30000  # 30 seconds (default)
```

### Model Selection

**OpenRouter models:**
- `anthropic/claude-3.5-sonnet` - Best quality, slower, more expensive
- `anthropic/claude-3-haiku` - Faster, cheaper
- `openai/gpt-4-turbo` - OpenAI's best
- `openai/gpt-3.5-turbo` - Faster, cheaper

**Google models:**
- `gemini-1.5-pro` - Best quality
- `gemini-1.5-flash` - Fast and cheap (default)
- `gemini-1.0-pro` - Legacy

## Testing Each Provider

### Test Mock Provider
```bash
# Set in .env
AI_PROVIDER=mock

# Test
curl -X POST http://localhost:4321/api/recipes/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "quick pasta recipe"}'

# Should return instantly with mock data
```

### Test Google Provider
```bash
# Set in .env
AI_PROVIDER=google
GOOGLE_API_KEY=your_key

# Test
curl -X POST http://localhost:4321/api/recipes/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "healthy curry recipe"}'

# Should take 5-15 seconds, return real AI-generated recipe
```

### Test OpenRouter Provider
```bash
# Set in .env
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=your_key

# Test
curl -X POST http://localhost:4321/api/recipes/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "vegetarian burger"}'

# Should take 5-20 seconds depending on model
```

## Troubleshooting

### Error: "AI_PROVIDER environment variable not set"
- Check `.env` file exists in project root
- Verify `AI_PROVIDER` is set
- Restart dev server

### Error: "OPENROUTER_API_KEY environment variable not set"
- Set API key in `.env` file
- Make sure provider matches: `AI_PROVIDER=openrouter`
- Restart dev server

### Error: "GOOGLE_API_KEY environment variable not set"
- Set API key in `.env` file
- Make sure provider matches: `AI_PROVIDER=google`
- Restart dev server

### Mock provider not working
- Verify: `AI_PROVIDER=mock` in `.env`
- Mock provider doesn't need API keys
- Check server logs for errors

### Real provider returning errors
- Verify API key is correct
- Check API key has credits/quota
- Verify model name is correct for provider
- Check network connectivity

## Cost Comparison

### Mock Provider
- **Cost:** Free
- **Use case:** Development only
- **Quality:** Fixed templates, not dynamic

### Google AI Studio (Gemini)
- **Cost:** ~$0.001-0.01 per recipe (depending on model)
- **Use case:** Production, good balance
- **Quality:** High quality, fast

### OpenRouter
- **Cost:** Varies by model ($0.001-0.05 per recipe)
- **Use case:** Production, maximum flexibility
- **Quality:** Depends on chosen model

## Recommended Setup

**During Development:**
```env
AI_PROVIDER=mock
```

**Before Production:**
```env
AI_PROVIDER=google
GOOGLE_API_KEY=your_production_key
AI_MODEL=gemini-1.5-flash
AI_TIMEOUT_MS=30000
```

**For Maximum Quality (Production):**
```env
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=your_production_key
AI_MODEL=anthropic/claude-3.5-sonnet
AI_TIMEOUT_MS=45000
```

## Notes

- Mock provider is enabled by default in `.env.example`
- No code changes needed - just update `.env`
- All providers use the same endpoint: `POST /api/recipes/generate`
- Provider selection is automatic based on environment variables
- Switching providers requires server restart
