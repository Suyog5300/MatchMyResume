// src/services/matching.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import { StorageService } from './storage';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
console.log('GEMINI_API_KEY:', GEMINI_API_KEY);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

// src/services/matching.js
// src/services/matching.js

async function getModel() {
  const apiKey = await StorageService.getApiKey();
  if (!apiKey) throw new Error('API key not found');
  
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
}


export async function analyzeMatch(resume, jobDescription) {
  try {
    const model = await getModel();
    if (!resume) {
      throw new Error('Resume and job description are required');
    }

    const prompt = `
      Analyze how well this resume matches the job description. 
      Response must be valid JSON without backticks or markdown formatting.
      
      Format:
      {
        "matchPercentage": (number between 0-100),
        "analysis": {
          "skills": {
            "matching": [],
            "missing": []
          },
          "experience": {
            "analysis": ""
          }
        },
        "suggestions": []
      }

      Resume: ${resume}
      Job Description: ${jobDescription}
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Clean the response text to ensure valid JSON
    const cleanJson = text.replace(/```json|```/g, '').trim();
    
    try {
      const analysis = JSON.parse(cleanJson);
      return analysis;
    } catch (parseError) {
      console.error('Failed to parse analysis:', parseError);
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error('Analysis failed:', error);
    throw new Error('Failed to analyze match. Please try again.');
  }
}
