
import { GoogleGenAI, Type } from "@google/genai";
import type { Question } from '../types';

const fileToGenerativePart = (base64: string, mimeType: string) => {
  return {
    inlineData: {
      data: base64,
      mimeType,
    },
  };
};

export const analyzePdf = async (pdfBase64: string, pdfMimeType: string, questions: Question[]): Promise<Question[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const pdfPart = fileToGenerativePart(pdfBase64, pdfMimeType);
  const questionList = questions.map(q => q.question);

  const prompt = `
    You are an expert legal and contract assistant. Your task is to analyze the provided PDF document, which is a contract or a public tender document, and extract specific information based on a list of questions.

    The document is provided as the first part of the input.
    The questions are provided below.

    Please provide your answers in the specified JSON format. The output should be a JSON array of objects, where each object corresponds to a question and has two keys: "question" and "answer". The order of the objects in your response array MUST match the order of the questions in the input.

    For each question, find the relevant information within the PDF and provide a concise answer. If you cannot find the information for a specific question, the value for "answer" should be "Información no encontrada en el documento.".

    List of questions:
    ${JSON.stringify(questionList)}

    Analyze the attached PDF and respond with the structured JSON as requested.
  `;

  const responseSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        question: { type: Type.STRING },
        answer: { type: Type.STRING },
      },
      required: ['question', 'answer'],
    },
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: { parts: [pdfPart, { text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const resultText = response.text.trim();
    const parsedResult = JSON.parse(resultText);

    if (!Array.isArray(parsedResult)) {
        throw new Error("API did not return a valid array.");
    }

    return questions.map((originalQuestion, index) => ({
      ...originalQuestion,
      answer: parsedResult[index]?.answer || "No se recibió respuesta para esta pregunta.",
    }));

  } catch (error) {
    console.error("Error analyzing PDF with Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to analyze PDF: ${error.message}`);
    }
    throw new Error("An unknown error occurred during PDF analysis.");
  }
};
