
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const suggestRuleLogic = async (prompt: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Suggest a CRA (Compliance Risk Assessment) rule logic for: ${prompt}. Return a structured JSON object with condition name, description, and suggested action.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          ruleName: { type: Type.STRING },
          condition: { type: Type.STRING },
          description: { type: Type.STRING },
          suggestedAction: { type: Type.STRING }
        },
        required: ["ruleName", "condition", "description", "suggestedAction"]
      }
    }
  });

  return JSON.parse(response.text);
};
