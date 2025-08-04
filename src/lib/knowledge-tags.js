// src/lib/knowledge-tags.js

import axios from 'axios';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const AI_MODEL = process.env.AI_MODEL || 'deepseek/deepseek-r1-distill-llama-70b';

async function generateKnowledgeTags(title, content) {
  if (!OPENROUTER_API_KEY) {
    console.warn('OpenRouter API key not found. Returning default tags.');
    return ['general', 'knowledge'];
  }

  try {
    const prompt = `
Analyze the following knowledge base article and generate 3-5 relevant tags that would help categorize and search for this content. 

Title: ${title}
Content: ${content}

Return only the tags as a comma-separated list, no explanations or additional text. Tags should be lowercase, single words or short phrases with hyphens.

Example format: customer-service, billing, technical-support, troubleshooting
`;

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: AI_MODEL,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 100,
        temperature: 0.3
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
          'X-Title': 'Iris Knowledge Base'
        }
      }
    );

    const generatedText = response.data.choices[0]?.message?.content?.trim();
    
    if (!generatedText) {
      console.warn('No response from AI model. Using default tags.');
      return ['general', 'knowledge'];
    }

    // Parse the comma-separated tags
    const tags = generatedText
      .split(',')
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0 && tag.length <= 50) // Reasonable tag length
      .slice(0, 5); // Limit to 5 tags max

    return tags.length > 0 ? tags : ['general', 'knowledge'];

  } catch (error) {
    console.error('Error generating knowledge tags:', error.message);
    
    // Return some basic tags based on title/content analysis as fallback
    const fallbackTags = [];
    const text = (title + ' ' + content).toLowerCase();
    
    if (text.includes('customer') || text.includes('client')) fallbackTags.push('customer-service');
    if (text.includes('technical') || text.includes('tech')) fallbackTags.push('technical');
    if (text.includes('billing') || text.includes('payment')) fallbackTags.push('billing');
    if (text.includes('support') || text.includes('help')) fallbackTags.push('support');
    if (text.includes('troubleshoot') || text.includes('problem')) fallbackTags.push('troubleshooting');
    
    return fallbackTags.length > 0 ? fallbackTags : ['general', 'knowledge'];
  }
}

export default generateKnowledgeTags;
