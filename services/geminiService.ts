import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found in environment");
  return new GoogleGenAI({ apiKey });
};

export const analyzeSchema = async (
  projectDescription: string,
  currentCollections: string,
  existingSchema: string = ""
) => {
  try {
    const client = getClient();
    const prompt = `
      You are an expert in Vector Database schemas and Unity Game Development.
      
      The user is building a semantic search tool for their Unity project using Qdrant and Gemini Embeddings.
      
      Project Description: "${projectDescription}"
      Current Qdrant Collection Name: "${currentCollections}"
      ${existingSchema ? `Existing Schema/Payload Structure: "${existingSchema}"` : ""}
      
      Suggest 3 optimizations for the Qdrant payload schema or indexing strategy. 
      For example, should they filter by 'AssetType' (Script vs Markdown)? Should they include 'MethodSignature' in the payload?
      ${existingSchema ? "Analyze the provided schema for potential improvements." : ""}
      
      Format the response as a JSON object with a 'suggestions' array, where each item has a 'title' and 'reasoning'.
    `;

    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    return JSON.parse(response.text || "{\"suggestions\": []}");
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return { suggestions: [{ title: "Error", reasoning: "Could not retrieve suggestions. Ensure API Key is valid." }] };
  }
};