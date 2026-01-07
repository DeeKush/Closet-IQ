const wardrobe = [];

// Image preview
const imageInput = document.querySelector('#image-upload');
const previewContainer = document.querySelector('.wardrobe-preview');

imageInput.addEventListener('change', () => {
  const file = imageInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    previewContainer.innerHTML = '';
    const img = document.createElement('img');
    img.src = reader.result;
    previewContainer.appendChild(img);
  };
  reader.readAsDataURL(file);
});

// Capture metadata
const addToWardrobeBtn = document.querySelector('#addToWardrobe');
const clothingTypeSelect = document.querySelector('#clothing-type');
const occasionSelect = document.querySelector('#occasion');

addToWardrobeBtn.addEventListener('click', () => {
  const previewImg = previewContainer.querySelector('img');
  if (!previewImg) return;

  const type = clothingTypeSelect.value;
  const occasion = occasionSelect.value;

  if (!type || !occasion) return;

  const cloth = {
    image: previewImg.src,
    type: type,
    occasion: occasion
  };

  wardrobe.push(cloth);
  console.log(wardrobe);
});
