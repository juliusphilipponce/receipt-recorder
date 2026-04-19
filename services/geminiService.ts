import { ReceiptData } from '../types';

// Helper function to convert a File object to a base64 string
const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      } else {
        resolve('');
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

    const response = await fetch('/.netlify/functions/analyzeReceipt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imagePart,
        useTodayDate
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const parsedData = await response.json();
    return parsedData as ReceiptData;

  } catch (error) {
    console.error("Error analyzing receipt via serverless function:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to analyze receipt: ${error.message}`);
    }
    throw new Error("An unknown error occurred while analyzing the receipt.");
  }
};