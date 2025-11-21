import { GoogleGenAI } from "@google/genai";

// Initialize the Gemini client
// process.env.API_KEY is guaranteed to be available by the runtime environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to convert File to Base64 string (stripping the data URL prefix)
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data:image/xyz;base64, prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const generateOrEditImage = async (
  prompt: string,
  sourceImageFile?: File | null
): Promise<string> => {
  try {
    // "Nano banana" maps to 'gemini-2.5-flash-image'
    const model = 'gemini-2.5-flash-image';
    
    const parts: any[] = [];

    // If there is a source image, we are in "Edit" mode (or image-guided generation)
    if (sourceImageFile) {
      const base64Data = await fileToBase64(sourceImageFile);
      parts.push({
        inlineData: {
          data: base64Data,
          mimeType: sourceImageFile.type, // e.g. 'image/png', 'image/jpeg'
        },
      });
    }

    // Add the text prompt
    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: parts,
      },
    });

    // The model may return text (refusal/explanation) or image data.
    // We iterate to find the image.
    let imageUrl = '';

    if (response.candidates && response.candidates.length > 0) {
        const content = response.candidates[0].content;
        if (content && content.parts) {
            for (const part of content.parts) {
                if (part.inlineData) {
                    const mimeType = part.inlineData.mimeType || 'image/png';
                    const data = part.inlineData.data;
                    imageUrl = `data:${mimeType};base64,${data}`;
                    break; // Found the image, exit loop
                } else if (part.text) {
                    console.log("Model returned text:", part.text);
                    // If we haven't found an image yet, we might want to capture this text to show an error,
                    // but for this simple return type, we'll prioritize finding the image.
                }
            }
        }
    }

    if (!imageUrl) {
      throw new Error("The model did not return an image. It might have refused the prompt.");
    }

    return imageUrl;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};