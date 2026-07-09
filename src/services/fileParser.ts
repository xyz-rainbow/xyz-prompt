/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import mammoth from 'mammoth';

export interface ParsedPromptResult {
  title: string;
  content: string;
}

/**
 * Parses uploaded file based on its extension
 */
export async function parseFileContent(file: File): Promise<ParsedPromptResult> {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  const title = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;

  switch (extension) {
    case 'txt':
    case 'md': {
      const text = await readFileAsText(file);
      return { title, content: text.trim() };
    }

    case 'json': {
      const text = await readFileAsText(file);
      try {
        const parsed = JSON.parse(text);
        let content = '';
        let customTitle = title;

        if (typeof parsed === 'string') {
          content = parsed;
        } else if (Array.isArray(parsed)) {
          // If it's a list, look for prompt strings or join them
          content = parsed.map((item: any) => {
            if (typeof item === 'string') return item;
            return item.content || item.prompt || item.text || JSON.stringify(item);
          }).join('\n\n');
        } else if (typeof parsed === 'object' && parsed !== null) {
          content = parsed.content || parsed.prompt || parsed.text || parsed.template || JSON.stringify(parsed, null, 2);
          if (parsed.title) customTitle = parsed.title;
        } else {
          content = text;
        }
        return { title: customTitle, content: content.trim() };
      } catch {
        throw new Error('invalidJson');
      }
    }

    case 'csv': {
      const text = await readFileAsText(file);
      const content = parseCsvToText(text);
      return { title, content };
    }

    case 'docx': {
      const arrayBuffer = await readFileAsArrayBuffer(file);
      try {
        const result = await (mammoth as any).convertToMarkdown({ arrayBuffer });
        return { title, content: result.value.trim() };
      } catch (err: any) {
        console.error('DOCX conversion error:', err);
        throw new Error('parserError');
      }
    }

    case 'pdf': {
      const arrayBuffer = await readFileAsArrayBuffer(file);
      try {
        const content = extractPdfText(arrayBuffer);
        return { title, content: content.trim() };
      } catch (err: any) {
        console.error('PDF parsing error:', err);
        throw new Error('parserError');
      }
    }

    default: {
      // Fallback: try reading as plain text
      const text = await readFileAsText(file);
      return { title, content: text.trim() };
    }
  }
}

// Helper: Read file as text
function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string || '');
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
}

// Helper: Read file as ArrayBuffer
function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as ArrayBuffer || new ArrayBuffer(0));
    reader.onerror = (e) => reject(e);
    reader.readAsArrayBuffer(file);
  });
}

// Helper: Parse CSV rows and extract textual prompt columns
function parseCsvToText(csvText: string): string {
  const lines = csvText.split(/\r?\n/);
  const rows: string[][] = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    
    // Simple CSV cell splitter that handles quotes
    const row: string[] = [];
    let insideQuote = false;
    let currentCell = '';

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        row.push(currentCell.trim());
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    row.push(currentCell.trim());
    rows.push(row);
  }

  if (rows.length === 0) return '';

  // Find index of column that likely contains prompts (longest cells)
  let bestColIndex = 0;
  let maxLen = 0;

  const numCols = rows[0].length;
  for (let c = 0; c < numCols; c++) {
    let colLen = 0;
    for (let r = 0; r < Math.min(rows.length, 5); r++) {
      if (rows[r][c]) colLen += rows[r][c].length;
    }
    if (colLen > maxLen) {
      maxLen = colLen;
      bestColIndex = c;
    }
  }

  // Map rows to prompt contents
  const promptsList = rows.map((row, index) => {
    const cellValue = row[bestColIndex] || '';
    // Strip surrounding quotes
    return cellValue.replace(/^"|"$/g, '').replace(/""/g, '"');
  }).filter(text => text.length > 5);

  return promptsList.join('\n\n---\n\n');
}

/**
 * Helper: Extract printable text chunks from raw PDF Binary stream.
 * PDF stores text inside stream operators like (string) Tj or [(string) 10 (string)] TJ.
 * This function decodes the arraybuffer into string, finds strings inside parentheses,
 * and reconstructs readable text chunks while ignoring binary headers and structures.
 */
function extractPdfText(arrayBuffer: ArrayBuffer): string {
  const uint8 = new Uint8Array(arrayBuffer);
  let text = '';
  const len = uint8.length;
  
  // Convert binary array to standard character stream in chunks to avoid stack overflow
  const chunkSize = 65536;
  let rawStr = '';
  for (let i = 0; i < len; i += chunkSize) {
    const subArray = uint8.subarray(i, i + chunkSize);
    rawStr += String.fromCharCode.apply(null, Array.from(subArray));
  }

  // Regular expression to look for text operators Tj/TJ: matches content in parentheses (like text)
  // PDF strings inside streams look like (Hello World) Tj or [(Some) 10 (Text)] TJ
  // We also capture hex strings like <48656c6c6f> Tj
  const matches = rawStr.matchAll(/\((.*?)\)\s*(?:Tj|TJ|T\*|Td|TD|tm|Tj|'|")/g);
  let chunks: string[] = [];
  
  for (const match of matches) {
    let content = match[1];
    
    // Clean up escaped characters standard in PDF strings, e.g., \), \n, \r
    content = content
      .replace(/\\([\(\)])/g, '$1')
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t');
      
    // Skip small binary residues or format strings
    if (content.trim().length > 0 && !content.startsWith('/') && !content.includes('Adobe')) {
      chunks.push(content);
    }
  }

  // Fallback: If Tj/TJ regex yields nothing (e.g. compressed streams), scan raw strings in brackets
  if (chunks.length === 0) {
    const backupMatches = rawStr.match(/\(([^)]+)\)/g);
    if (backupMatches) {
      for (const m of backupMatches) {
        const content = m.slice(1, -1);
        if (content.length > 4 && !content.includes('%') && !content.startsWith('/') && !/^[0-9\s.-]+$/.test(content)) {
          chunks.push(content);
        }
      }
    }
  }

  if (chunks.length === 0) {
    // If absolutely no readable PDF text structures found, let's look for standard ASCII chunks
    const asciiChunks = rawStr.replace(/[^\x20-\x7E\n\r\t]/g, ' ');
    const lines = asciiChunks.split(/[\r\n]+/);
    const cleaned = lines
      .map(line => line.trim())
      .filter(line => line.length > 15 && !line.startsWith('xref') && !line.startsWith('trailer') && !line.startsWith('startxref'))
      .slice(0, 100); // limit fallback to prevent massive spam
    return cleaned.join('\n');
  }

  // Combine text chunks and clean formatting gaps
  let combined = '';
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    // Simple heuristic: if chunks are small single-letter or numbers, combine them directly, otherwise add space
    if (chunk.length === 1 || /^[0-9]+$/.test(chunk)) {
      combined += chunk;
    } else {
      combined += ' ' + chunk;
    }
  }

  // Reflow lines nicely
  return combined
    .replace(/\s+/g, ' ')
    .replace(/\\/g, '')
    .trim();
}
