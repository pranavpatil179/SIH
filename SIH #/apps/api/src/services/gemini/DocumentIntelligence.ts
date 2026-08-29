import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY!;
const genAI = new GoogleGenerativeAI(apiKey);

export class DocumentIntelligence {
  async extractDocument(base64Image: string, mimeType: string, docType?: string) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
      const prompt = `Extract details from this document. ${docType ? 'It is a ' + docType : ''}. Return structured JSON only: { document_type, company_name, pan, gstin, registration_number, address, issue_date, expiry_date, relevant_fields }`;
      
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Image,
            mimeType
          }
        }
      ]);
      const text = result.response.text();
      const match = text.match(/\{.*\}/s);
      const json = match ? JSON.parse(match[0]) : {};
      json.data_source = 'AI_ANALYSIS';
      return json;
    } catch (error) {
      console.error(error);
      return { error: 'AI analysis temporarily unavailable' };
    }
  }

  async classifyDocument(base64Image: string, mimeType: string) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
      const prompt = "What type of document is this? (e.g. PAN Card, GST Certificate, Incorporation Certificate). Return only the type string.";
      const result = await model.generateContent([{ inlineData: { data: base64Image, mimeType } }, prompt]);
      return { type: result.response.text().trim(), data_source: 'AI_ANALYSIS' };
    } catch {
      return { error: 'AI analysis temporarily unavailable' };
    }
  }

  validateExtraction(extracted: any, expectedDocType: string) {
    return { valid: extracted.document_type?.toLowerCase().includes(expectedDocType.toLowerCase()) };
  }
}
