# Deployment Instructions

## Prerequisites
- Cloudflare account
- Wrangler CLI installed (`npm install -g wrangler` or use the local version)

## Local Development
```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

## Production Deployment

### 1. First-time Setup

```bash
# Login to Cloudflare
npx wrangler login

# Set the Gemini API key as a secret (will be prompted to enter the value)
npx wrangler secret put GEMINI_API_KEY
# When prompted, enter your Gemini API key

# Create the R2 bucket if it doesn't exist
npx wrangler r2 bucket create generative-adventure-storage
```

### 2. Deploy to Cloudflare Workers

```bash
# Build the React editor and deploy
npm run deploy
```

### 3. Verify Deployment

After deployment, Wrangler will output your Worker URL. The application will be available at:
- Main app: `https://generative-adventure.<your-subdomain>.workers.dev`
- Editor: `https://generative-adventure.<your-subdomain>.workers.dev/editor/`

## Available Scripts

- `npm run dev` - Start local development server
- `npm run build:editor` - Build the React editor
- `npm run deploy` - Build and deploy to Cloudflare Workers
- `npm run preview` - Preview the deployment locally

## Environment Variables

- `GEMINI_API_KEY` - Google Gemini API key (stored as Wrangler secret)
- For local development, create a `.dev.vars` file (already configured)

## R2 Storage

The application uses Cloudflare R2 for storing story data:
- Binding: `STORY_STORAGE`
- Bucket: `generative-adventure-storage`
- Preview bucket: `generative-adventure-storage-preview`