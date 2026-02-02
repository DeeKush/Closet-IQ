const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const GEMINI_MODEL = 'gemini-1.5-flash';

// Analyze clothing image to auto-detect type and occasions
export async function analyzeClothingImage(base64Image) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error('Gemini API key not configured. Please set VITE_GEMINI_API_KEY in your .env file.');
    }

    // Remove the data URL prefix if present
    const imageData = base64Image.includes(',')
        ? base64Image.split(',')[1]
        : base64Image;

    const prompt = `Analyze this clothing item image and classify it.

TASK: Identify the clothing type and suggest suitable occasions.

RESPOND WITH VALID JSON ONLY:
{
  "type": "top" | "bottom" | "footwear",
  "occasions": ["casual", "formal", "party", "sports", "work"],
  "description": "Brief description of the item"
}

RULES:
- type MUST be exactly one of: "top", "bottom", "footwear"
- top = shirts, t-shirts, jackets, sweaters, hoodies, blouses, tank tops, etc.
- bottom = pants, jeans, shorts, skirts, trousers, leggings, etc.
- footwear = shoes, sneakers, boots, sandals, heels, loafers, etc.
- occasions should be an array of suitable occasions from: casual, formal, party, sports, work
- Include ALL occasions that the item could work for`;

    const apiUrl = `${GEMINI_BASE_URL}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

    const requestBody = {
        contents: [{
            role: 'user',
            parts: [
                {
                    inlineData: {
                        mimeType: 'image/jpeg',
                        data: imageData
                    }
                },
                {
                    text: prompt
                }
            ]
        }],
        generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 256,
            topP: 0.8,
            topK: 20
        }
    };

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Gemini API Error:', errorData);
        throw new Error('Unable to analyze image. Please check your API key.');
    }

    const data = await response.json();
    const textResponse = data.candidates[0].content.parts[0].text;

    return parseGeminiResponse(textResponse);
}

export async function getOutfitFromAI(wardrobe, occasion) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error('Gemini API key not configured. Please set VITE_GEMINI_API_KEY in your .env file.');
    }

    // Prepare clean wardrobe data (without base64 images to reduce payload)
    const cleanWardrobe = wardrobe.map(item => ({
        id: item.id,
        type: item.type,
        occasion: item.occasion
    }));

    const prompt = `You are a fashion assistant for ClosetIQ, a wardrobe management app designed for people who waste too much time deciding what to wear.

TASK: Select ONE complete outfit from the user's existing wardrobe for the "${occasion}" occasion.

WARDROBE DATA:
${JSON.stringify(cleanWardrobe, null, 2)}

RULES:
1. Select items ONLY from the wardrobe above
2. Select exactly ONE item from each type: top, bottom, footwear
3. ALL selected items MUST have occasion="${occasion}"
4. Respond with VALID JSON ONLY, no other text

REQUIRED JSON FORMAT:
{
  "top": "item_id_here",
  "bottom": "item_id_here",
  "footwear": "item_id_here",
  "reason": "Short explanation of why these items work together"
}

If insufficient items exist, respond with:
{
  "error": "Not enough items for this occasion"
}`;

    const apiUrl = `${GEMINI_BASE_URL}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

    const requestBody = {
        contents: [{
            role: 'user',
            parts: [{
                text: prompt
            }]
        }],
        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 512,
            topP: 0.9,
            topK: 40
        }
    };

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Gemini API Error:', errorData);
        throw new Error('Unable to connect to AI service');
    }

    const data = await response.json();
    const textResponse = data.candidates[0].content.parts[0].text;

    return textResponse;
}

export function parseGeminiResponse(textResponse) {
    // Remove markdown code blocks if present
    let cleaned = textResponse.trim();
    if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/```\n?/g, '');
    }

    try {
        return JSON.parse(cleaned);
    } catch (e) {
        console.error('Failed to parse Gemini response:', textResponse);
        throw new Error('Invalid response format from AI');
    }
}
