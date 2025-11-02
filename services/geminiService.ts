import { GoogleGenAI, Type } from "@google/genai";
import { ReceiptData } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

// Helper function to convert a File object to a base64 string
const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      } else {
        resolve(''); // Should not happen with readAsDataURL
      }
    };
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};


export const analyzeReceipt = async (imageFile: File): Promise<ReceiptData> => {
  try {
    const imagePart = await fileToGenerativePart(imageFile);
    
    const textPart = {
      text: `Analyze the provided receipt image. Extract the merchant name, transaction date, total amount, and a list of all items with their corresponding prices. Ensure the output is in the specified JSON format. If a value is not clear, make a reasonable guess or leave it as an empty string or 0 for numbers.`
    };

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            merchantName: {
              type: Type.STRING,
              description: "The name of the store or merchant."
            },
            date: {
              type: Type.STRING,
              description: "The date of the transaction in YYYY-MM-DD format."
            },
            total: {
              type: Type.NUMBER,
              description: "The final total amount paid."
            },
            items: {
              type: Type.ARRAY,
              description: "A list of items purchased.",
              items: {
                type: Type.OBJECT,
                properties: {
                  name: {
                    type: Type.STRING,
                    description: "The name of the item."
                  },
                  price: {
                    type: Type.NUMBER,
                    description: "The price of the item."
                  }
                },
                required: ["name", "price"]
              }
            }
          },
          required: ["merchantName", "date", "total", "items"]
        },
      },
    });

    let jsonText = response.text.trim();
    // The model can sometimes wrap the JSON in markdown code blocks (` ```json ... ``` `).
    // This logic strips those fences to prevent JSON parsing errors.
    if (jsonText.startsWith("```json")) {
        jsonText = jsonText.slice(7, -3).trim();
    } else if (jsonText.startsWith("```")) {
        jsonText = jsonText.slice(3, -3).trim();
    }

    const parsedData = JSON.parse(jsonText);

    // Basic validation
    if (!parsedData.merchantName || !parsedData.items) {
      throw new Error("Failed to parse receipt data correctly.");
    }
    
    return parsedData as ReceiptData;

  } catch (error) {
    console.error("Error analyzing receipt with Gemini:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to analyze receipt: ${error.message}`);
    }
    throw new Error("An unknown error occurred while analyzing the receipt.");
  }
};