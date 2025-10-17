// Test script to verify the OpenAI integration components work
import { getOpenAI } from "./openai";
import { loadBrandContext } from "./brandContext";

export async function testOpenAIIntegration() {
  try {
    console.log("🧪 Testing OpenAI Integration Components...");
    
    // Test 1: OpenAI client
    if (!process.env.OPENAI_API_KEY) {
      console.log("❌ OPENAI_API_KEY not set - skipping OpenAI tests");
      return false;
    }
    
    console.log("✅ OPENAI_API_KEY is set");
    
    // Test 2: OpenAI client creation
    const client = getOpenAI();
    console.log("✅ OpenAI client created");
    
    // Test 3: Brand context loading
    const testOrgId = "fd3fcfe3-ce7d-40e4-bf7a-53604f5a7c79"; // From your logs
    const brandContext = await loadBrandContext(testOrgId);
    console.log("✅ Brand context loaded:", {
      isEmpty: brandContext.isEmpty,
      usedFallback: brandContext.usedFallback,
      keywords: brandContext.keywords.length,
      moods: brandContext.moods.length,
    });
    
    // Test 4: Simple OpenAI call
    console.log("🤖 Testing OpenAI API call...");
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "user", content: "Say 'OpenAI integration is working!' in exactly those words." }
      ],
      max_tokens: 20
    });
    
    const message = response.choices[0]?.message?.content;
    console.log("✅ OpenAI response:", message);
    
    return true;
  } catch (error) {
    console.error("❌ Integration test failed:", error);
    return false;
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testOpenAIIntegration().then(success => {
    process.exit(success ? 0 : 1);
  });
}
