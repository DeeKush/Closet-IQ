const STORAGE_KEY = 'closetIQ-wardrobe';
let wardrobe = [];

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

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
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

  // Outfit generation logic (pure function, no DOM access)
  function generateOutfit(wardrobe, occasion) {
    if (!occasion) return null;

    // Filter items by selected occasion
    const matchingItems = wardrobe.filter(item => item.occasion === occasion);

    // Separate by type
    const tops = matchingItems.filter(item => item.type === 'top');
    const bottoms = matchingItems.filter(item => item.type === 'bottom');
    const footwear = matchingItems.filter(item => item.type === 'footwear');

    // Check if we have at least one of each category
    if (tops.length === 0 || bottoms.length === 0 || footwear.length === 0) {
      return null;
    }

    // Return random item from each category
    return {
      top: tops[Math.floor(Math.random() * tops.length)],
      bottom: bottoms[Math.floor(Math.random() * bottoms.length)],
      footwear: footwear[Math.floor(Math.random() * footwear.length)]
    };
  }

  // Render outfit display (UI only, no logic)
  function renderOutfit(outfit) {
    const outfitResult = document.querySelector('#outfit-result');
    if (!outfitResult) return;

    outfitResult.innerHTML = '';

    if (!outfit) {
      outfitResult.innerHTML = '<div class="outfit-message">Not enough items for this occasion. Please add at least one top, bottom, and footwear item.</div>';
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
  }

  // Get Outfit button handler (outfit.html only)
  if (generateOutfitBtn && outfitOccasionSelect) {
    generateOutfitBtn.addEventListener('click', () => {
      const selectedOccasion = outfitOccasionSelect.value;

      if (!selectedOccasion) {
        alert('Please select an occasion first!');
        return;
      }

      const outfit = generateOutfit(wardrobe, selectedOccasion);
      renderOutfit(outfit);
    });
  }
});
