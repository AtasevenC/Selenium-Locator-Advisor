import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { AdvisorPayload } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateAnalysis = async (payload: AdvisorPayload): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: JSON.stringify(payload),
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.2, // Low temperature for deterministic, technical output
      },
    });

    return response.text || "No analysis generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate analysis. Please check your input and API key.");
  }
};
