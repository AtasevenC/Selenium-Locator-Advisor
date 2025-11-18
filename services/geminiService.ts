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
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    const errorMessage = error.message || error.toString();
    
    if (errorMessage.includes("429") || errorMessage.includes("quota")) {
        return "**⚠️ API Quota Exceeded**\n\nThe demo API key has reached its limit. Please try again in a minute, or use the 'Live Inspector' mode to generate locators manually without AI.";
    }
    
    if (errorMessage.includes("503") || errorMessage.includes("overloaded")) {
        return "**⚠️ Service Overloaded**\n\nThe AI service is currently busy. Please try again in a few seconds.";
    }

    return `**⚠️ Analysis Failed**\n\nAn error occurred while contacting the AI service: ${errorMessage}. \n\nPlease check your connection and try again.`;
  }
};