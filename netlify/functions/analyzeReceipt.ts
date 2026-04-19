import { Handler } from '@netlify/functions';
import { GoogleGenAI, Type } from "@google/genai";

export const handler: Handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
    const { imagePart, useTodayDate } = JSON.parse(event.body || '{}');

    if (!imagePart || !imagePart.inlineData) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Missing imagePart data' }) };
    }

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
      model: "gemini-3.1-flash-lite-preview",
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
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.slice(7, -3).trim();
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.slice(3, -3).trim();
    }

    const parsedData = JSON.parse(jsonText);

    if (useTodayDate) {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      parsedData.date = `${year}-${month}-${day}`;
    }

    if (!parsedData.merchantName || !parsedData.items) {
      throw new Error("Failed to parse receipt data correctly.");
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(parsedData)
    };

  } catch (error) {
    console.error("Error analyzing receipt with Gemini:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred while analyzing the receipt.";
    return {
      statusCode: 500,
      body: JSON.stringify({ error: errorMessage })
    };
  }
};
