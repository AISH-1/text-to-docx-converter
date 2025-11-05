# Text to DOCX Converter - Vercel Backend

A serverless API for converting plain text to Microsoft Word DOCX format, designed for Dify/Tsunagi AI integration.

## 🚀 Features

- ✅ Convert plain text to DOCX format
- ✅ Automatic paragraph detection
- ✅ Heading support (using # or ALL CAPS)
- ✅ Cloud storage with Vercel Blob
- ✅ Dify-compatible output format
- ✅ Public download URLs
- ✅ CORS enabled for API integration

## 📋 Prerequisites

1. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI** (optional for local testing)
3. **Node.js 18+** installed locally

## 🛠️ Setup Instructions

### Step 1: Create Project Structure

Create the following folder structure:

```
text-to-docx-converter/
├── api/
│   └── text-to-docx.js
├── package.json
├── vercel.json
└── README.md
```

### Step 2: Install Vercel CLI (Optional)

```bash
npm install -g vercel
```

### Step 3: Deploy to Vercel

#### Option A: Deploy via GitHub (Recommended)

1. Create a new repository on GitHub
2. Push your code to the repository
3. Go to [vercel.com/new](https://vercel.com/new)
4. Import your GitHub repository
5. Vercel will auto-detect the configuration
6. Click **Deploy**

#### Option B: Deploy via CLI

```bash
# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

### Step 4: Setup Vercel Blob Storage

1. Go to your project dashboard on Vercel
2. Navigate to **Storage** tab
3. Click **Create Database** → **Blob**
4. Click **Connect** to your project
5. Vercel will automatically set the `BLOB_READ_WRITE_TOKEN` environment variable

### Step 5: Get Your API Endpoint

After deployment, you'll get a URL like:
```
https://your-project-name.vercel.app
```

Your API endpoint will be:
```
https://your-project-name.vercel.app/api/text-to-docx
```

## 📡 API Usage

### Endpoint

```
POST https://your-project-name.vercel.app/api/text-to-docx
```

### Request Body

```json
{
  "text": "Your plain text here\n\nThis is a new paragraph\n\n# This is a heading",
  "filename": "my-document" 
}
```

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `text` | string | Yes | The plain text content to convert |
| `filename` | string | No | Custom filename (without extension) |

### Response Format (Dify-Compatible)

```json
{
  "status": "success",
  "files": [
    {
      "dify_model_identity": "__dify__file__",
      "id": "uuid-here",
      "type": "document",
      "transfer_method": "tool_file",
      "filename": "document-uuid.docx",
      "extension": ".docx",
      "mime_type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "size": 15409,
      "url": "https://blob-url-here.vercel-storage.com/document.docx"
    }
  ],
  "metadata": {
    "paragraphs": 3,
    "characters": 150,
    "created_at": "2025-11-05T12:00:00.000Z"
  }
}
```

## 🎨 Text Formatting

The converter supports basic formatting:

### Headings
```
# This becomes a Heading
## Also a heading
ALL CAPS SHORT TEXT (becomes a heading)
```

### Paragraphs
```
Regular text becomes a paragraph.

Empty lines separate paragraphs.
```

### Example Input
```json
{
  "text": "# My Document Title\n\nThis is the introduction paragraph.\n\nThis is another paragraph with more details.\n\n## Section Heading\n\nContent under the section.",
  "filename": "report"
}
```

## 🧪 Testing

### Using cURL

```bash
curl -X POST https://your-project-name.vercel.app/api/text-to-docx \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello World\n\nThis is a test document.",
    "filename": "test"
  }'
```

### Using Postman

1. Method: `POST`
2. URL: `https://your-project-name.vercel.app/api/text-to-docx`
3. Headers: `Content-Type: application/json`
4. Body (raw JSON):
```json
{
  "text": "Your text here",
  "filename": "test"
}
```

## 🔧 Local Development

### Setup

```bash
# Install dependencies
npm install

# Start development server
vercel dev
```

Your API will be available at:
```
http://localhost:3000/api/text-to-docx
```

### Environment Variables

Create a `.env` file for local testing:
```
BLOB_READ_WRITE_TOKEN=your_token_here
```

Get the token from Vercel Dashboard → Storage → Blob → .env.local tab

## 🔗 Dify/Tsunagi AI Integration

### Step 1: Create OpenAPI Specification

(See the separate OpenAPI spec artifact)

### Step 2: Add Custom Tool in Dify

1. Go to Dify/Tsunagi AI workspace
2. Navigate to **Tools** → **Custom Tools**
3. Click **Create Custom Tool**
4. Paste the OpenAPI specification
5. Replace `your-project-name` with your actual Vercel project name
6. Save and test

### Step 3: Use in Workflow

The tool will return a file object that can be:
- Downloaded by users
- Passed to other tools
- Stored in Dify's file system

## 📊 Limits & Considerations

### Vercel Free Tier
- ✅ 100GB bandwidth/month
- ✅ 6,000 execution minutes/month
- ✅ 10 second max execution time
- ✅ 4.5MB request body size

### Vercel Blob Storage (Free Tier)
- ✅ 500GB storage
- ✅ 500GB bandwidth/month
- ✅ Files persist indefinitely (until manually deleted)

### Recommended Usage
- Maximum text size: ~1MB (about 500 pages)
- Files are publicly accessible via URL
- Consider adding authentication for production use

## 🔒 Security Considerations

### Current Setup (Development)
- ✅ CORS enabled for all origins
- ✅ Public file URLs (no authentication)
- ⚠️ No rate limiting
- ⚠️ No API key validation

### For Production
Consider adding:
1. **API Key Authentication**: Validate requests with a secret key
2. **Rate Limiting**: Prevent abuse
3. **Input Validation**: Sanitize text input
4. **File Expiration**: Auto-delete files after X hours
5. **Restricted CORS**: Only allow your Dify domain

## 🐛 Troubleshooting

### Error: "Blob token not found"
- Ensure Vercel Blob storage is connected to your project
- Check environment variable `BLOB_READ_WRITE_TOKEN` is set

### Error: "Method not allowed"
- Ensure you're using POST method, not GET

### Error: "Text field is required"
- Check your request body includes `"text"` field
- Ensure Content-Type header is `application/json`

### Files not downloading
- Check the blob URL is publicly accessible
- Verify blob storage has public access enabled

## 📚 Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Blob Storage](https://vercel.com/docs/storage/vercel-blob)
- [docx Library](https://docx.js.org/)
- [Dify Custom Tools](https://docs.dify.ai/guides/tools)

## 🎉 Next Steps

1. ✅ Deploy to Vercel
2. ✅ Setup Blob Storage
3. ✅ Test the API endpoint
4. ✅ Create OpenAPI spec with your URL
5. ✅ Integrate with Dify/Tsunagi AI
6. ✅ Start converting text to DOCX!

## 💡 Support

If you encounter issues:
1. Check Vercel function logs in dashboard
2. Verify environment variables are set
3. Test locally with `vercel dev`
4. Review the error response message

---

Built for Dify/Tsunagi AI Integration 🚀