let wardrobe = [];

// LocalStorage functions
function saveToLocalStorage() {
  localStorage.setItem('closetIQ-wardrobe', JSON.stringify(wardrobe));
}

function loadFromLocalStorage() {
  const stored = localStorage.getItem('closetIQ-wardrobe');
  if (stored) {
    wardrobe = JSON.parse(stored);
  }
}

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
  // Image preview
  const imageInput = document.querySelector('#image-upload');
  const previewContainer = document.querySelector('.wardrobe-preview');
  const wardrobeGrid = document.querySelector('#wardrobe-items');

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

  // Render wardrobe dynamically
  function renderWardrobe() {
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
          <button class="delete-btn" data-index="${index}">Delete</button>
        </div>
      `;

      wardrobeGrid.appendChild(card);
    });

    // Add delete functionality
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        wardrobe.splice(index, 1);
        saveToLocalStorage();
        renderWardrobe();
      });
    });
  }

  // Capture metadata
  const addToWardrobeBtn = document.querySelector('#addToWardrobe');
  const clothingTypeSelect = document.querySelector('#clothing-type');
  const occasionSelect = document.querySelector('#occasion');

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

  // Load data and render on page load
  loadFromLocalStorage();
  renderWardrobe();
});
