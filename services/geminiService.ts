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

export const analyzeReceipt = async (imageFile: File, useTodayDate: boolean = false): Promise<ReceiptData[]> => {
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

    const responseBody = await response.text();
    
    if (!response.ok) {
      let errorMsg = `HTTP error! status: ${response.status}`;
      try {
        const errorData = JSON.parse(responseBody);
        errorMsg = errorData.error || errorMsg;
      } catch (e) {
        errorMsg = responseBody || errorMsg;
      }
      throw new Error(errorMsg);
    }

    try {
      const parsedData = JSON.parse(responseBody);
      return parsedData as ReceiptData[];
    } catch (parseError) {
      console.error("Failed to parse response as JSON:", responseBody);
      throw new Error(`Invalid JSON response from server: ${responseBody.substring(0, 100)}...`);
    }

  } catch (error) {
    console.error("Error analyzing receipt via serverless function:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to analyze receipt: ${error.message}`);
    }
    throw new Error("An unknown error occurred while analyzing the receipt.");
  }
};