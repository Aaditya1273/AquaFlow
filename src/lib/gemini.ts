// Gemini AI Integration for AquaFlow
// Provides intelligent intent parsing and DeFi assistance

import { GoogleGenerativeAI } from '@google/generative-ai';

interface SwapIntent {
  tokenIn: string;
  tokenOut: string;
  amount: string;
  slippageTolerance?: number;
  deadline?: number;
  confidence: number;
}

interface GeminiResponse {
  intent: SwapIntent | null;
  explanation: string;
  suggestions: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

class AquaFlowAI {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  async parseIntent(userMessage: string): Promise<GeminiResponse> {
    const prompt = `
You are AquaFlow AI, an expert DeFi assistant for Arbitrum ecosystem. 
Parse this user message into a structured swap intent.

User Message: "${userMessage}"

Available tokens: USDC, USDT, ETH, ARB, WETH
Available chains: Arbitrum One, Arbitrum Nova, Arbitrum Sepolia

Respond with JSON in this exact format:
{
  "intent": {
    "tokenIn": "USDC",
    "tokenOut": "USDT", 
    "amount": "100",
    "slippageTolerance": 0.5,
    "deadline": 1800,
    "confidence": 0.95
  },
  "explanation": "I understand you want to swap 100 USDC to USDT with 0.5% slippage tolerance.",
  "suggestions": [
    "Consider using Arbitrum Nova for lower fees",
    "Current USDC/USDT rate is very stable"
  ],
  "riskLevel": "low"
}

If the message is not a swap intent, set intent to null and provide helpful guidance.
Always be helpful, accurate, and focused on DeFi best practices.
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback response
      return {
        intent: null,
        explanation: "I couldn't parse that as a swap intent. Try something like 'Swap 100 USDC to USDT'",
        suggestions: ["Use format: 'Swap [amount] [token] to [token]'"],
        riskLevel: 'low'
      };
    } catch (error) {
      console.error('Gemini AI Error:', error);
      return {
        intent: null,
        explanation: "Sorry, I'm having trouble understanding. Please try again.",
        suggestions: ["Check your internet connection", "Try a simpler message"],
        riskLevel: 'low'
      };
    }
  }

  async analyzeRoute(tokenIn: string, tokenOut: string, amount: string): Promise<string> {
    const prompt = `
As AquaFlow AI, analyze this DeFi swap route on Arbitrum:

Swap: ${amount} ${tokenIn} → ${tokenOut}

Provide analysis covering:
1. Current market conditions
2. Optimal routing strategy
3. Gas cost considerations
4. Risk assessment
5. Timing recommendations

Keep response concise but informative for DeFi users.
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Route analysis error:', error);
      return "Unable to analyze route at this time. Please proceed with caution.";
    }
  }

  async explainGasSavings(solidityGas: number, stylusGas: number): Promise<string> {
    const savings = ((solidityGas - stylusGas) / solidityGas * 100).toFixed(1);
    
    const prompt = `
Explain why AquaFlow's Stylus implementation saves ${savings}% gas compared to traditional Solidity:

Solidity Gas: ${solidityGas.toLocaleString()}
Stylus Gas: ${stylusGas.toLocaleString()}
Savings: ${savings}%

Explain in simple terms why Stylus (Rust → WASM) is more efficient than Solidity (EVM bytecode).
Keep it educational but accessible.
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gas explanation error:', error);
      return `Stylus saves ${savings}% gas through more efficient WASM execution compared to EVM bytecode.`;
    }
  }

  async suggestOptimalTiming(tokenIn: string, tokenOut: string): Promise<string> {
    const prompt = `
As a DeFi expert, suggest optimal timing for swapping ${tokenIn} to ${tokenOut} on Arbitrum.

Consider:
- Current network congestion
- Typical gas price patterns
- Market volatility
- Liquidity conditions

Provide actionable timing advice.
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Timing suggestion error:', error);
      return "Current conditions appear suitable for swapping. Monitor gas prices for optimal timing.";
    }
  }
}

// Singleton instance
let aquaFlowAI: AquaFlowAI | null = null;

export const initializeAI = (apiKey: string) => {
  aquaFlowAI = new AquaFlowAI(apiKey);
  return aquaFlowAI;
};

export const getAI = (): AquaFlowAI | null => {
  return aquaFlowAI;
};

export type { SwapIntent, GeminiResponse };