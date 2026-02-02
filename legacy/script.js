import { GEMINI_API_KEY } from './config.js';

const STORAGE_KEY = 'closetIQ-wardrobe';
// Gemini API configuration
// Using v1beta API endpoint which supports Gemini 1.5 models
const GEMINI_BASE_URL = 'https://generativeai.googleapis.com/v1beta';
const GEMINI_MODEL = 'gemini-1.5-flash';
let wardrobe = [];

// Gemini API wrapper for AI-powered outfit recommendations
async function getOutfitFromAI(wardrobe, occasion) {
  // Prepare clean wardrobe data (without base64 images to reduce payload)
  const cleanWardrobe = wardrobe.map(item => ({
    id: item.id,
    type: item.type,
    occasion: item.occasion
  }));

  const prompt = `You are a fashion assistant for ClosetIQ, a wardrobe management app.

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

  const apiUrl = `${GEMINI_BASE_URL}/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

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

// LocalStorage functions
function saveToLocalStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(wardrobe));
}

function loadFromLocalStorage() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      wardrobe = JSON.parse(stored);
      // Migrate old items without IDs
      let needsSave = false;
      wardrobe = wardrobe.map((item, index) => {
        if (!item.id) {
          needsSave = true;
          return { ...item, id: Date.now() + index };
        }
        return item;
      });
      if (needsSave) {
        saveToLocalStorage();
      }
    } catch (e) {
      console.error('Failed to load wardrobe data:', e);
      wardrobe = [];
    }
  }
}

// Load wardrobe data immediately on all pages
loadFromLocalStorage();

// Set active navbar link based on current page
function setActiveNavLink() {
  const currentPage = window.location.pathname;
  const navLinks = document.querySelectorAll('.navbar a');
  
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    
    // Remove active class from all links
    link.classList.remove('active');
    
    // Check if current page matches the link
    if (currentPage.endsWith(href) || 
        (href === 'index.html' && (currentPage.endsWith('/') || currentPage.endsWith('index.html')))) {
      link.classList.add('active');
    }
  });
}

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
  // Set active navbar link
  setActiveNavLink();
  
  // Get DOM elements
  const imageInput = document.querySelector('#image-upload');
  const previewContainer = document.querySelector('.wardrobe-preview');
  const wardrobeGrid = document.querySelector('#wardrobe-items');
  const addToWardrobeBtn = document.querySelector('#addToWardrobe');
  const clothingTypeSelect = document.querySelector('#clothing-type');
  const occasionSelect = document.querySelector('#occasion');
  const generateOutfitBtn = document.querySelector('#generate-outfit-btn');
  const outfitOccasionSelect = document.querySelector('#outfit-occasion');

  // Render wardrobe dynamically
  function renderWardrobe() {
    if (!wardrobeGrid) return;

    wardrobeGrid.innerHTML = '';

    if (wardrobe.length === 0) {
      wardrobeGrid.innerHTML = '<p class="empty-message">No items yet. Start adding clothes to your wardrobe!</p>';
      return;
    }

    wardrobe.forEach((cloth, index) => {
      const card = document.createElement('div');
      card.className = 'wardrobe-card';

      card.innerHTML = `
        <img src="${cloth.image}" alt="${cloth.type}">
        <div class="card-info">
          <p class="card-type"><strong>Type:</strong> ${cloth.type.charAt(0).toUpperCase() + cloth.type.slice(1)}</p>
          <p class="card-occasion"><strong>Occasion:</strong> ${cloth.occasion.charAt(0).toUpperCase() + cloth.occasion.slice(1)}</p>
          <button class="delete-btn" data-id="${cloth.id}">Delete</button>
        </div>
      `;

      wardrobeGrid.appendChild(card);
    });

    // Add delete functionality
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseFloat(e.target.dataset.id);
        wardrobe = wardrobe.filter(item => item.id !== id);
        saveToLocalStorage();
        renderWardrobe();
      });
    });
  }

  // Image upload and preview (wardrobe.html only)
  if (imageInput && previewContainer) {
    imageInput.addEventListener('change', () => {
      const file = imageInput.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        previewContainer.innerHTML = '';
        const img = document.createElement('img');
        img.src = reader.result;
        img.alt = 'Preview';
        previewContainer.appendChild(img);
      };
      reader.readAsDataURL(file);
    });
  }

  // Add to wardrobe functionality (wardrobe.html only)
  if (addToWardrobeBtn && clothingTypeSelect && occasionSelect && previewContainer) {
    addToWardrobeBtn.addEventListener('click', () => {
      const previewImg = previewContainer.querySelector('img');
      if (!previewImg) {
        alert('Please upload an image first!');
        return;
      }

      const type = clothingTypeSelect.value;
      const occasion = occasionSelect.value;

      if (!type || !occasion) {
        alert('Please select both clothing type and occasion!');
        return;
      }

      const cloth = {
        id: Date.now(),
        image: previewImg.src,
        type: type,
        occasion: occasion
      };

      wardrobe.push(cloth);
      saveToLocalStorage();
      renderWardrobe();

      // Clear form and preview
      imageInput.value = '';
      clothingTypeSelect.value = '';
      occasionSelect.value = '';
      previewContainer.innerHTML = '';

      // Show success feedback
      alert('Item added to wardrobe successfully!');
    });
  }

  // Render wardrobe if grid exists (wardrobe.html only)
  if (wardrobeGrid) {
    renderWardrobe();
  }

  // Parse Gemini JSON response safely
  function parseGeminiResponse(textResponse) {
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

  // Generate outfit using AI
  async function generateAIOutfit(wardrobe, occasion) {
    if (!occasion) {
      return { error: 'Please select an occasion' };
    }

    // Check if we have items for this occasion
    const matchingItems = wardrobe.filter(item => item.occasion === occasion);
    const tops = matchingItems.filter(item => item.type === 'top');
    const bottoms = matchingItems.filter(item => item.type === 'bottom');
    const footwear = matchingItems.filter(item => item.type === 'footwear');

    if (tops.length === 0 || bottoms.length === 0 || footwear.length === 0) {
      return { error: 'Not enough items for this occasion. Add at least one top, bottom, and footwear.' };
    }

    try {
      const aiResponse = await getOutfitFromAI(wardrobe, occasion);
      const parsed = parseGeminiResponse(aiResponse);
      
      if (parsed.error) {
        return { error: parsed.error };
      }

      // Find actual items from wardrobe by ID
      const topItem = wardrobe.find(item => item.id == parsed.top);
      const bottomItem = wardrobe.find(item => item.id == parsed.bottom);
      const footwearItem = wardrobe.find(item => item.id == parsed.footwear);

      if (!topItem || !bottomItem || !footwearItem) {
        console.error('AI selected invalid IDs:', parsed);
        return { error: 'AI selected items that do not exist in wardrobe' };
      }

      return {
        top: topItem,
        bottom: bottomItem,
        footwear: footwearItem,
        reason: parsed.reason || 'AI-selected outfit'
      };
    } catch (error) {
      console.error('AI outfit generation failed:', error);
      return { error: `AI service error: ${error.message}` };
    }
  }

  // Render outfit display with AI reasoning
  function renderOutfit(outfit) {
    const outfitResult = document.querySelector('#outfit-result');
    if (!outfitResult) return;

    outfitResult.innerHTML = '';

    // Handle error messages
    if (outfit.error) {
      outfitResult.innerHTML = `<div class="outfit-message error-message">${outfit.error}</div>`;
      return;
    }

    const outfitDisplay = document.createElement('div');
    outfitDisplay.className = 'outfit-display';

    // Render each piece in order: top, bottom, footwear
    ['top', 'bottom', 'footwear'].forEach(type => {
      const item = outfit[type];
      const itemDiv = document.createElement('div');
      itemDiv.className = 'outfit-item';
      itemDiv.innerHTML = `
        <img src="${item.image}" alt="${type}">
        <div class="outfit-item-label">${type}</div>
      `;
      outfitDisplay.appendChild(itemDiv);
    });

    outfitResult.appendChild(outfitDisplay);

    // Add AI reasoning if available
    if (outfit.reason) {
      const reasonDiv = document.createElement('div');
      reasonDiv.className = 'outfit-reasoning';
      reasonDiv.innerHTML = `<strong>AI Recommendation:</strong> ${outfit.reason}`;
      outfitResult.appendChild(reasonDiv);
    }
  }

  // Get Outfit button handler (outfit.html only)
  if (generateOutfitBtn && outfitOccasionSelect) {
    generateOutfitBtn.addEventListener('click', async () => {
      const selectedOccasion = outfitOccasionSelect.value;
      const outfitResult = document.querySelector('#outfit-result');

      if (!selectedOccasion) {
        outfitResult.innerHTML = '<div class="outfit-message error-message">Please select an occasion first!</div>';
        return;
      }

      // Show loading state
      outfitResult.innerHTML = '<div class="outfit-message">Generating outfit with AI...</div>';
      generateOutfitBtn.disabled = true;

      const outfit = await generateAIOutfit(wardrobe, selectedOccasion);
      renderOutfit(outfit);

      generateOutfitBtn.disabled = false;
    });
  }
});
