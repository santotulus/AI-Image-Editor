import { GoogleGenAI, Modality } from "@google/genai";
import { EditedImageResult, ImageFile } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const fileToGenerativePart = (base64: string, mimeType: string) => {
  return {
    inlineData: {
      data: base64,
      mimeType,
    },
  };
};

export const editImageWithPrompt = async (
  originalImage: { base64: string; mimeType: string },
  prompt: string,
  customModelImage?: { base64: string; mimeType: string }
): Promise<EditedImageResult> => {
  try {
    const imagePart = fileToGenerativePart(originalImage.base64, originalImage.mimeType);
    const textPart = { text: prompt };

    // FIX: Explicitly type `parts` to allow both image (`inlineData`) and text parts.
    // This prevents a TypeScript error caused by inferring the array type from only the first element.
    const parts: ({ inlineData: { data: string; mimeType: string; }; } | { text: string; })[] = [imagePart];
    if (customModelImage) {
      parts.push(fileToGenerativePart(customModelImage.base64, customModelImage.mimeType));
    }
    parts.push(textPart);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: parts,
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });
    
    let imageUrl: string | null = null;
    let text: string | null = null;

    if (response.candidates && response.candidates.length > 0) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64ImageBytes: string = part.inlineData.data;
          imageUrl = `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
        } else if (part.text) {
          text = part.text;
        }
      }
    }

    if (!imageUrl) {
      throw new Error("API did not return an image. It might be due to a safety policy violation.");
    }
    
    return { imageUrl, text };

  } catch (error) {
    console.error("Error editing image with Gemini:", error);
    if (error instanceof Error) {
        return Promise.reject(error.message);
    }
    return Promise.reject("An unknown error occurred while editing the image.");
  }
};
