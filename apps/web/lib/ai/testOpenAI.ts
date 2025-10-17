// Test script to verify OpenAI integration setup
import { getOpenAI } from "./openai";

export async function testOpenAISetup() {
  try {
    console.log("Testing OpenAI setup...");
    
    // Check if API key is set
    if (!process.env.OPENAI_API_KEY) {
      console.log("❌ OPENAI_API_KEY is not set");
      return false;
    }
    
    console.log("✅ OPENAI_API_KEY is set");
    
    // Try to create OpenAI client
    const client = getOpenAI();
    console.log("✅ OpenAI client created successfully");
    
    // Test a simple completion (this will actually call OpenAI)
    console.log("Testing OpenAI API call...");
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "user", content: "Say 'Hello, OpenAI integration is working!'" }
      ],
      max_tokens: 10
    });
    
    const message = response.choices[0]?.message?.content;
    console.log("✅ OpenAI API response:", message);
    
    return true;
  } catch (error) {
    console.error("❌ OpenAI test failed:", error);
    return false;
  }
}
