import { Transaction } from '../types';

export class LLMService {
  private async callLLM(prompt: string): Promise<string> {
    // TODO: Replace with actual LLM API call
    // This is a mock implementation
    try {
        const response = await fetch(process.env.LLM_API_ENDPOINT || "", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.LLM_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                {
                    role: "system",
                    content: "You are a payment analytics expert. Analyze the transaction data and provide a concise, insightful summary focusing on key patterns, success rates, and notable events. Be specific and data-driven in your analysis."
                },
                {
                    role: "user",
                    content: prompt
                }
                ],
                temperature: 0.7,
                max_tokens: 500
            })
        });
        const data: any = await response.json();
        console.log(data);
        return data.choices[0].message.content;
    } catch(error) {
        console.error('Error calling LLM:', error);
        throw error;
    }
  }

  async generateTenantSummary(tenantId: string, transactions: Transaction[]): Promise<string> {
    const prompt = `Analyze the following payment transaction data for tenant ${tenantId} and provide a concise summary of their payment processing activity. Focus on patterns, success rates, and notable events.

Transaction Data:
${JSON.stringify(transactions, null, 2)}

Please provide a natural language summary of the payment processing activity. Keep it short and concise without new lines.`;

    return this.callLLM(prompt);
  }
} 