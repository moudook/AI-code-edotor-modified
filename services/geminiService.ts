import { GoogleGenAI, Type } from "@google/genai";
import { CorrectionResponse } from '../types';

const lineCorrectionSchema = {
  type: Type.OBJECT,
  properties: {
    lineNumber: { type: Type.INTEGER, description: 'The line number (1-indexed).' },
    original: { type: Type.STRING, description: 'The original line of code.' },
    corrected: { type: Type.STRING, description: 'The corrected line of code. If no error, this is same as original.' },
    isError: { type: Type.BOOLEAN, description: 'True if the original line contains an error.' },
    explanation: { type: Type.STRING, description: 'A brief explanation of the correction or why the line is correct.' }
  },
  required: ['lineNumber', 'original', 'corrected', 'isError', 'explanation']
};

const webCodeCorrectionSchema = {
  type: Type.OBJECT,
  properties: {
    htmlCorrections: {
      type: Type.ARRAY,
      description: 'An array of line-by-line corrections for the HTML file.',
      items: lineCorrectionSchema
    },
    cssCorrections: {
      type: Type.ARRAY,
      description: 'An array of line-by-line corrections for the CSS file.',
      items: lineCorrectionSchema
    }
  },
  required: ['htmlCorrections', 'cssCorrections']
};

export const correctCode = async (htmlCode: string, cssCode: string): Promise<CorrectionResponse> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
You are an expert web developer specializing in HTML and CSS. Analyze the following HTML and CSS code snippets. They are designed to work together.
Your task is to identify mistakes, inconsistencies, bad practices, and accessibility issues in both files, considering their relationship. For example, a CSS selector might not match any HTML element, an HTML tag might be used incorrectly, or styling might be inefficient.

For EACH file (HTML and CSS), break it down line by line.
For every single line in BOTH files, you must provide a JSON object with these fields: 'lineNumber', 'original', 'corrected', 'isError', and 'explanation'.
- 'corrected' should be the same as 'original' if there is no error on that line.
- 'isError' must be true if you made a correction.

Return a single JSON object that strictly adheres to the provided schema. The object must contain two keys: "htmlCorrections" and "cssCorrections". Each key must hold an array of the line-by-line analysis objects for the respective file.

HTML Code:
\`\`\`html
${htmlCode}
\`\`\`

CSS Code:
\`\`\`css
${cssCode}
\`\`\`
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: webCodeCorrectionSchema,
        temperature: 0.2,
      },
    });

    const jsonText = response.text.trim();
    const parsedJson = JSON.parse(jsonText);
    
    if (parsedJson && Array.isArray(parsedJson.htmlCorrections) && Array.isArray(parsedJson.cssCorrections)) {
      return parsedJson as CorrectionResponse;
    } else {
      throw new Error("Invalid JSON response format from API. Expected 'htmlCorrections' and 'cssCorrections' arrays.");
    }

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to correct code: ${error.message}`);
    }
    throw new Error("An unknown error occurred while correcting code.");
  }
};


export const getChatResponse = async (htmlCode: string, cssCode: string, query: string): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `
You are an expert web development assistant. Your role is to answer questions and provide explanations about the user's code.
Given the following HTML and CSS, please answer the user's question concisely. Format your response using Markdown for readability.

HTML Code:
\`\`\`html
${htmlCode}
\`\`\`

CSS Code:
\`\`\`css
${cssCode}
\`\`\`

User's Question: "${query}"
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", 
      contents: prompt,
    });
    
    return response.text;

  } catch (error) {
    console.error("Error calling Gemini API for chat:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to get chat response: ${error.message}`);
    }
    throw new Error("An unknown error occurred during chat.");
  }
};
