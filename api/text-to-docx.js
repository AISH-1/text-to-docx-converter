// api/text-to-docx.js
// Vercel Serverless Function for Text to DOCX Conversion with Markdown Support

const { Document, Paragraph, TextRun, HeadingLevel, Packer, AlignmentType, UnderlineType } = require('docx');
const { put } = require('@vercel/blob');
const { randomUUID } = require('crypto');
const { marked } = require('marked');

// Parse Markdown tokens into DOCX paragraphs
function parseMarkdownToDocx(markdown) {
  const tokens = marked.lexer(markdown);
  const paragraphs = [];

  tokens.forEach(token => {
    switch (token.type) {
      case 'heading':
        const headingLevels = {
          1: HeadingLevel.HEADING_1,
          2: HeadingLevel.HEADING_2,
          3: HeadingLevel.HEADING_3,
          4: HeadingLevel.HEADING_4,
          5: HeadingLevel.HEADING_5,
          6: HeadingLevel.HEADING_6,
        };
        paragraphs.push(new Paragraph({
          text: token.text,
          heading: headingLevels[token.depth] || HeadingLevel.HEADING_1,
          spacing: {
            before: 240,
            after: 120,
          },
        }));
        break;

      case 'paragraph':
        const textRuns = parseInlineMarkdown(token.text);
        paragraphs.push(new Paragraph({
          children: textRuns,
          spacing: {
            after: 200,
          },
        }));
        break;

      case 'list':
        token.items.forEach(item => {
          const textRuns = parseInlineMarkdown(item.text);
          paragraphs.push(new Paragraph({
            children: [
              new TextRun({ text: '• ', size: 24 }),
              ...textRuns
            ],
            spacing: {
              after: 120,
            },
            indent: {
              left: 720, // 0.5 inch indent
            },
          }));
        });
        break;

      case 'blockquote':
        paragraphs.push(new Paragraph({
          text: token.text.replace(/\n/g, ' '),
          italics: true,
          spacing: {
            after: 200,
          },
          indent: {
            left: 720,
          },
        }));
        break;

      case 'code':
        // Code block
        const codeLines = token.text.split('\n');
        codeLines.forEach(line => {
          paragraphs.push(new Paragraph({
            children: [
              new TextRun({
                text: line,
                font: 'Courier New',
                size: 20,
              }),
            ],
            spacing: {
              after: 100,
            },
            shading: {
              fill: 'F5F5F5',
            },
          }));
        });
        break;

      case 'hr':
        paragraphs.push(new Paragraph({
          text: '_______________________________________________________________',
          spacing: {
            before: 200,
            after: 200,
          },
        }));
        break;

      case 'space':
        paragraphs.push(new Paragraph({
          text: '',
          spacing: {
            after: 100,
          },
        }));
        break;

      default:
        // For any other token types, try to extract text
        if (token.text) {
          paragraphs.push(new Paragraph({
            text: token.text,
            spacing: {
              after: 200,
            },
          }));
        }
        break;
    }
  });

  return paragraphs;
}

// Parse inline markdown (bold, italic, code, etc.)
function parseInlineMarkdown(text) {
  const textRuns = [];

  // Simple regex-based parsing for inline elements
  // This handles **bold**, *italic*, `code`, ~~strikethrough~~
  const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`|~~.*?~~|[^*`~]+)/g;
  const matches = text.match(regex) || [text];

  matches.forEach(match => {
    if (match.startsWith('**') && match.endsWith('**')) {
      // Bold
      textRuns.push(new TextRun({
        text: match.slice(2, -2),
        bold: true,
        size: 24,
      }));
    } else if (match.startsWith('*') && match.endsWith('*')) {
      // Italic
      textRuns.push(new TextRun({
        text: match.slice(1, -1),
        italics: true,
        size: 24,
      }));
    } else if (match.startsWith('`') && match.endsWith('`')) {
      // Inline code
      textRuns.push(new TextRun({
        text: match.slice(1, -1),
        font: 'Courier New',
        size: 22,
        shading: {
          fill: 'F5F5F5',
        },
      }));
    } else if (match.startsWith('~~') && match.endsWith('~~')) {
      // Strikethrough
      textRuns.push(new TextRun({
        text: match.slice(2, -2),
        strike: true,
        size: 24,
      }));
    } else {
      // Regular text
      textRuns.push(new TextRun({
        text: match,
        size: 24,
      }));
    }
  });

  return textRuns;
}

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
    const { text, filename, format } = req.body;

    // Validate input
    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Text field is required and must be a string'
      });
    }

    // Parse markdown to DOCX paragraphs
    // Default to markdown format, but allow 'plain' for backward compatibility
    let docSections;
    if (format === 'plain') {
      // Plain text mode (original behavior)
      const paragraphs = text.split('\n').filter(line => line.trim() !== '');
      docSections = paragraphs.map(paragraph => {
        const isHeading = paragraph.startsWith('#') ||
          (paragraph === paragraph.toUpperCase() && paragraph.length < 50);

        if (isHeading) {
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
                size: 24,
              }),
            ],
            spacing: {
              after: 200,
            },
          });
        }
      });
    } else {
      // Markdown mode (default)
      docSections = parseMarkdownToDocx(text);
    }

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

    // Count paragraphs and characters
    const paragraphCount = docSections.length;
    const characterCount = text.length;

    // Return Dify/Tsunagi AI compatible response format
    return res.status(200).send({
      text: blob.url,
    });


  } catch (error) {
    console.error('Error converting text to DOCX:', error);
    return res.status(500).json({
      error: 'Conversion failed',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};