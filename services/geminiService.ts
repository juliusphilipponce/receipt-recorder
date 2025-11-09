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


export const analyzeReceipt = async (imageFile: File, useTodayDate: boolean = false): Promise<ReceiptData> => {
  try {
    const imagePart = await fileToGenerativePart(imageFile);

    // If useTodayDate is true, we'll skip date extraction and use today's date
    const shouldExtractDate = !useTodayDate;

    const textPart = {
      text: `Analyze the provided receipt image. Extract the merchant name, ${shouldExtractDate ? 'transaction date,' : ''} total amount, and a list of all items with their corresponding prices.

${shouldExtractDate ? `
CRITICAL DATE EXTRACTION RULES - READ CAREFULLY:
- Philippine receipts ALWAYS use DD/MM/YYYY format (DAY/MONTH/YEAR)
- The FIRST number is ALWAYS the DAY, the SECOND number is ALWAYS the MONTH
- NEVER interpret dates as MM/DD/YYYY (American format)

Examples of CORRECT date interpretation:
- "09/11/2024" or "9/11/2024" = 9th of November 2024 → convert to "2024-11-09"
- "11/09/2024" = 11th of September 2024 → convert to "2024-09-11"
- "05/11/2025" = 5th of November 2025 → convert to "2025-11-05"
- "15/03/2024" = 15th of March 2024 → convert to "2024-03-15"

WRONG interpretation examples (DO NOT DO THIS):
- "09/11/2024" ≠ September 11th (this is WRONG)
- "09/11/2024" = November 9th (this is CORRECT)

Additional rules:
- Convert all dates to YYYY-MM-DD format
- If the date format is ambiguous, ALWAYS use DD/MM/YYYY interpretation
- The date should never be in the future - if your interpretation results in a future date, reconsider the format
- If you see a date that could be valid in both formats, choose DD/MM/YYYY
` : ''}
Ensure the output is in the specified JSON format. If a value is not clear, make a reasonable guess or leave it as an empty string or 0 for numbers.`
    };

    // Build the schema properties dynamically based on whether we're extracting the date
    const schemaProperties: any = {
      merchantName: {
        type: Type.STRING,
        description: "The name of the store or merchant."
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
    };

    // Only include date in schema if we're extracting it
    if (shouldExtractDate) {
      schemaProperties.date = {
        type: Type.STRING,
        description: "The date of the transaction in YYYY-MM-DD format. Receipt dates are typically in DD/MM/YYYY format (e.g., 05/11/2025 = November 5, 2025)."
      };
    }

    const requiredFields = shouldExtractDate
      ? ["merchantName", "date", "total", "items"]
      : ["merchantName", "total", "items"];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: schemaProperties,
          required: requiredFields
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

    // If using today's date, set it now in YYYY-MM-DD format
    if (useTodayDate) {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      parsedData.date = `${year}-${month}-${day}`;
    }

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