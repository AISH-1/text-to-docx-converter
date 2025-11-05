// api/text-to-docx.js
// Vercel Serverless Function for Text to DOCX Conversion

const { Document, Paragraph, TextRun, HeadingLevel, Packer } = require('docx');
const { put } = require('@vercel/blob');
const { randomUUID } = require('crypto');

module.exports = async function handler(req, res) {
  // CORS headers for Dify integration
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, filename } = req.body;

    // Validate input
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ 
        error: 'Invalid input',
        message: 'Text field is required and must be a string' 
      });
    }

    // Parse text into paragraphs (split by newlines)
    const paragraphs = text.split('\n').filter(line => line.trim() !== '');

    // Create document sections
    const docSections = paragraphs.map(paragraph => {
      // Check if it's a heading (starts with # or is all caps and short)
      const isHeading = paragraph.startsWith('#') || 
                        (paragraph === paragraph.toUpperCase() && paragraph.length < 50);
      
      if (isHeading) {
        // Remove # symbols for headings
        const headingText = paragraph.replace(/^#+\s*/, '');
        return new Paragraph({
          text: headingText,
          heading: HeadingLevel.HEADING_1,
          spacing: {
            before: 240,
            after: 120,
          },
        });
      } else {
        return new Paragraph({
          children: [
            new TextRun({
              text: paragraph,
              size: 24, // 12pt font
            }),
          ],
          spacing: {
            after: 200,
          },
        });
      }
    });

    // Create the DOCX document
    const doc = new Document({
      sections: [{
        properties: {},
        children: docSections,
      }],
    });

    // Generate the DOCX file as buffer
    const buffer = await Packer.toBuffer(doc);

    // Generate unique filename
    const fileId = randomUUID();
    const docFilename = filename 
      ? `${filename.replace(/\.[^/.]+$/, '')}.docx` 
      : `document-${fileId}.docx`;

    // Upload to Vercel Blob Storage
    const blob = await put(docFilename, buffer, {
      access: 'public',
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    // Return Dify-formatted response
    const response = {
      status: 'success',
      files: [
        {
          dify_model_identity: '__dify__file__',
          id: fileId,
          type: 'document',
          transfer_method: 'tool_file',
          filename: docFilename,
          extension: '.docx',
          mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          size: buffer.length,
          url: blob.url,
        },
      ],
      metadata: {
        paragraphs: paragraphs.length,
        characters: text.length,
        created_at: new Date().toISOString(),
      },
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('Error converting text to DOCX:', error);
    return res.status(500).json({
      error: 'Conversion failed',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};