const imageInput = document.querySelector('input[type="file"]');
const previewContainer = document.querySelector(".wardrobe-preview");
imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    previewContainer.innerHTML = "";
    const img = document.createElement("img");
    img.src = reader.result;
    previewContainer.appendChild(img);
  };
  reader.readAsDataURL(file)
});
