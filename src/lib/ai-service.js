import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { SYSTEM_PROMPT } from './chat-config.js';

const prisma = new PrismaClient();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const AI_MODEL = process.env.AI_MODEL || 'deepseek/deepseek-r1-distill-llama-70b';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * Enhanced AI service with conversation memory and knowledge base integration
 */
export class AIService {
  constructor() {
    this.maxContextMessages = 20; // Keep last 20 messages for context
    this.maxKnowledgeResults = 5; // Max knowledge base articles to include
  }

  /**
   * Generate AI response with conversation memory and knowledge base context
   */
  async generateResponse(userMessage, conversationSessionId, customerId) {
    try {
      // Get conversation history for context
      const conversationHistory = await this.getConversationHistory(conversationSessionId);
      
      // Search knowledge base for relevant information
      const knowledgeContext = await this.searchKnowledgeBase(userMessage);
      
      // Get customer context
      const customerContext = await this.getCustomerContext(customerId);
      
      // Build enhanced system prompt with context
      const enhancedSystemPrompt = this.buildEnhancedSystemPrompt(
        knowledgeContext,
        customerContext,
        conversationHistory
      );
      
      // Prepare messages for AI
      const messages = [
        {
          role: "system",
          content: enhancedSystemPrompt,
        },
        ...conversationHistory.map(msg => ({
          role: msg.senderType === 'CUSTOMER' ? 'user' : 'assistant',
          content: msg.content
        })),
        {
          role: "user",
          content: userMessage,
        },
      ];

      // Call OpenRouter API
      const response = await this.callOpenRouterAPI(messages);
      
      // Track token usage
      const tokenUsage = {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0
      };

      return {
        content: response.choices[0]?.message?.content || "I apologize, but I'm having trouble processing your request.",
        tokenUsage,
        model: AI_MODEL,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('AI Service Error:', error);
      return {
        content: "I apologize, but I'm experiencing technical difficulties. Please try again in a moment.",
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get conversation history for context
   */
  async getConversationHistory(conversationSessionId) {
    if (!conversationSessionId) return [];

    try {
      const messages = await prisma.message.findMany({
        where: {
          conversationSessionId,
          deletedAt: null
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: this.maxContextMessages,
        select: {
          content: true,
          senderType: true,
          createdAt: true
        }
      });

      return messages.reverse(); // Return in chronological order
    } catch (error) {
      console.error('Error fetching conversation history:', error);
      return [];
    }
  }

  /**
   * Search knowledge base for relevant information
   */
  async searchKnowledgeBase(query) {
    try {
      // Simple keyword-based search (can be enhanced with vector search later)
      const keywords = this.extractKeywords(query);
      
      const knowledgeArticles = await prisma.companyknowledge.findMany({
        where: {
          OR: [
            {
              title: {
                contains: keywords.join(' '),
                mode: 'insensitive'
              }
            },
            {
              content: {
                contains: keywords.join(' '),
                mode: 'insensitive'
              }
            }
          ]
        },
        take: this.maxKnowledgeResults,
        select: {
          title: true,
          content: true,
          knowledgetag: {
            select: {
              name: true
            }
          }
        }
      });

      return knowledgeArticles;
    } catch (error) {
      console.error('Error searching knowledge base:', error);
      return [];
    }
  }

  /**
   * Get customer context for personalization
   */
  async getCustomerContext(customerId) {
    try {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        include: {
          customerProfile: true,
          chats: {
            where: { deleted: false },
            orderBy: { createdAt: 'desc' },
            take: 3,
            select: {
              status: true,
              priority: true,
              satisfied: true,
              createdAt: true
            }
          }
        }
      });

      return customer;
    } catch (error) {
      console.error('Error fetching customer context:', error);
      return null;
    }
  }

  /**
   * Build enhanced system prompt with context
   */
  buildEnhancedSystemPrompt(knowledgeContext, customerContext, conversationHistory) {
    let enhancedPrompt = SYSTEM_PROMPT;

    // Add knowledge base context
    if (knowledgeContext && knowledgeContext.length > 0) {
      enhancedPrompt += "\n\nRELEVANT KNOWLEDGE BASE INFORMATION:\n";
      knowledgeContext.forEach((article, index) => {
        enhancedPrompt += `${index + 1}. ${article.title}\n${article.content.substring(0, 500)}...\n\n`;
      });
    }

    // Add customer context
    if (customerContext) {
      enhancedPrompt += "\n\nCUSTOMER CONTEXT:\n";
      if (customerContext.name) {
        enhancedPrompt += `Customer Name: ${customerContext.name}\n`;
      }
      if (customerContext.customerProfile) {
        const profile = customerContext.customerProfile;
        if (profile.company) enhancedPrompt += `Company: ${profile.company}\n`;
        if (profile.industry) enhancedPrompt += `Industry: ${profile.industry}\n`;
        if (profile.totalChats > 0) enhancedPrompt += `Previous Chats: ${profile.totalChats}\n`;
      }
      if (customerContext.chats && customerContext.chats.length > 0) {
        enhancedPrompt += `Recent Chat History: ${customerContext.chats.length} recent conversations\n`;
      }
    }

    // Add conversation memory instructions
    if (conversationHistory && conversationHistory.length > 0) {
      enhancedPrompt += "\n\nCONVERSATION MEMORY:\n";
      enhancedPrompt += "You have access to the conversation history above. Reference previous messages when relevant to provide continuity and avoid repeating information.\n";
    }

    enhancedPrompt += "\n\nIMPORTANT: Use the knowledge base information and customer context to provide more accurate and personalized responses. Always prioritize the customer's specific question while being helpful and human-like.";

    return enhancedPrompt;
  }

  /**
   * Call OpenRouter API
   */
  async callOpenRouterAPI(messages) {
    if (!OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API key not configured');
    }

    const response = await axios.post(
      OPENROUTER_BASE_URL,
      {
        model: AI_MODEL,
        messages,
        max_tokens: 1000,
        temperature: 0.7,
        top_p: 0.9,
        frequency_penalty: 0.1,
        presence_penalty: 0.1
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
          'X-Title': 'Iris Chat Widget'
        }
      }
    );

    return response.data;
  }

  /**
   * Extract keywords from user query for knowledge base search
   */
  extractKeywords(query) {
    // Simple keyword extraction (can be enhanced with NLP)
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'];
    
    return query
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word))
      .slice(0, 10); // Limit to 10 keywords
  }

  /**
   * Clean up expired typing indicators
   */
  async cleanupExpiredTypingIndicators() {
    try {
      await prisma.typingIndicator.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });
    } catch (error) {
      console.error('Error cleaning up typing indicators:', error);
    }
  }
}

// Export singleton instance
export const aiService = new AIService();

// Export utility functions
export const formatAIResponse = (response) => {
  return {
    content: response.content,
    timestamp: response.timestamp,
    role: "assistant",
    tokenUsage: response.tokenUsage,
    model: response.model
  };
};
