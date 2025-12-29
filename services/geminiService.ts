import { GoogleGenAI } from "@google/genai";
import { REPORT_PROMPT_TEMPLATE } from "../constants";

export const generateWeeklyReport = async (apiKey: string): Promise<string> => {
  if (!apiKey) throw new Error("API Key is missing");

  const ai = new GoogleGenAI({ apiKey });

  try {
    const now = new Date();
    // Format: 2025-05-23
    const dateStr = now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'numeric', day: 'numeric' });
    // Format: 2025年5月23日
    const dateStrZH = now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });

    const prompt = REPORT_PROMPT_TEMPLATE
      .replace(/{{CURRENT_DATE}}/g, dateStr)
      .replace(/{{CURRENT_DATE_ZH}}/g, dateStrZH);

    // Use gemini-2.5-flash for efficiency and search capabilities
    const model = 'gemini-2.5-flash';

    const response = await ai.models.generateContent({
      model: model,
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      config: {
        tools: [{ googleSearch: {} }], // Enable Search Grounding
        temperature: 0.2, // Low temperature for high factual accuracy
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response from AI model");
    }

    return text;

  } catch (error: any) {
    console.error("Gemini Generation Error:", error);
    throw new Error(error.message || "Failed to generate report");
  }
};