import { GoogleGenAI, Modality } from "@google/genai";

const apiKey = process.env.API_KEY || '';

// Initialize safely to avoid crashes if env is missing during dev (though required for functionality)
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const fetchHistoricalDetails = async (topic: string, context: string): Promise<string> => {
  if (!ai) {
    return "API Key is missing. Please provide an API Key to use Gemini features.";
  }

  try {
    const model = 'gemini-2.5-flash';
    const prompt = `
      Provide a concise but insightful historical summary (approx 150 words) about: "${topic}".
      Context: This is for a visualization of the history of Buddhism.
      Specific context for this item: ${context}.
      Focus on its significance in the spread or development of Buddhist thought/history.
      Return plain text.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text || "No details available.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Failed to fetch details from Gemini. Please try again later.";
  }
};

export const generateSpeech = async (text: string): Promise<string | null> => {
  if (!ai) return null;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (error) {
    console.error("Gemini TTS Error:", error);
    return null;
  }
};