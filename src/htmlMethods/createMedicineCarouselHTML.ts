import { AVAILABLE_MEDICINES } from '../data.js';

/**
 * Generates HTML for the medicine carousel widget.
 * Creates a responsive carousel with navigation, FDA badges, and purchase links.
 * 
 * @param medicines - Array of medicine objects to display (defaults to all medicines)
 * @returns Complete HTML string ready for rendering in ChatGPT widget
 */
export function createMedicineCarouselHTML(medicines = AVAILABLE_MEDICINES): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Card Carousel</title>

<style>
body {
  font-family: Arial, sans-serif;
  background: transparent;
  display: flex;
  justify-content: center;
  padding: 40px;
}

/* Carousel Container */
.carousel {
  width: 420px;
  position: relative;
}

/* Header */
.carousel-header {
  font-size: 20px;
  margin-bottom: 15px;
}

/* Slide Wrapper */
.slides {
  overflow: hidden;
}

.slides-track {
  display: flex;
  gap: 12px;
  transition: transform 0.4s ease;
}

/* Card */
.card {
  flex: 0 0 calc(100% - 60px);
  background: #cfd6dc;
  padding: 20px;
  border-radius: 20px;
  box-sizing: border-box;
}

.card img {
  width: 100%;
  height: 200px;
  object-fit: contain;
  border-radius: 10px;
  background: #e2e8ed;
}

.card-title {
  font-weight: bold;
  font-size: 22px;
  margin-top: 15px;
}

/* Button */
.card-btn {
  margin-top: 15px;
  background: #d63a2f;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 30px;
  cursor: pointer;
  font-size: 14px;
  text-decoration: none;
  display: inline-block;
}

/* Navigation */
.nav {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 12px;
  gap: 10px;
}

.arrow {
  cursor: pointer;
  font-size: 20px;
  user-select: none;
}

.dots {
  display: flex;
  gap: 6px;
}

.dot {
  width: 8px;
  height: 8px;
  background: #ccc;
  border-radius: 50%;
  cursor: pointer;
}

.dot.active {
  background: #333;
}
</style>
</head>

<body>

<div class="carousel">

  <div class="carousel-header">
    Buy medicines online from Lilly Direct
  </div>

  <div class="slides">
    <div class="slides-track" id="track">

      ${medicines.map(medicine => `
      <!-- Slide: ${medicine.name} -->
      <div class="card">
        <img src="${medicine.image}" alt="${medicine.name}" crossorigin="anonymous" referrerpolicy="no-referrer" />
        <div class="card-title">${medicine.name}</div>
        <a href="${medicine.buyLink}" target="_blank" class="card-btn">${medicine.buyLinkText} &rarr;</a>
      </div>
      `).join('')}

    </div>
  </div>

  ${medicines.length > 1 ? `
  <!-- Navigation -->
  <div class="nav">
    <div class="arrow" onclick="prevSlide()">&#8249;</div>
    <div class="dots" id="dots"></div>
    <div class="arrow" onclick="nextSlide()">&#8250;</div>
  </div>
  ` : ''}

</div>

<script>
const track = document.getElementById("track");
const slides = document.querySelectorAll(".card");
const dotsContainer = document.getElementById("dots");

let index = 0;

/* Create dots */
if (dotsContainer) {
  slides.forEach((_, i) => {
    const dot = document.createElement("div");
    dot.classList.add("dot");
    if (i === 0) dot.classList.add("active");

    dot.addEventListener("click", () => {
      index = i;
      updateCarousel();
    });

    dotsContainer.appendChild(dot);
  });
}

const GAP = 12;
const container = document.querySelector('.slides');

function updateCarousel() {
  const cardWidth = slides[0] ? slides[0].getBoundingClientRect().width + GAP : 0;
  const maxScroll = track.scrollWidth - container.offsetWidth;
  let offset = index * cardWidth;
  if (offset > maxScroll) offset = maxScroll;
  track.style.transform = \`translateX(-\${offset}px)\`;

  document.querySelectorAll(".dot").forEach((dot, i) => {
    dot.classList.toggle("active", i === index);
  });

  if (window.oai && window.oai.widget && typeof window.oai.widget.setState === 'function') {
    window.oai.widget.setState({
      currentIndex: index,
      viewMode: 'medicine-carousel',
      medicineCount: slides.length
    });
  }
}

function nextSlide() {
  if (index < slides.length - 1) { index++; }
  else { index = 0; }
  updateCarousel();
}

function prevSlide() {
  if (index > 0) { index--; }
  else { index = slides.length - 1; }
  updateCarousel();
}

/* Touch / swipe support */
let touchStartX = 0;
let touchEndX = 0;
const SWIPE_THRESHOLD = 50;

track.addEventListener('touchstart', (e) => {
  touchStartX = e.changedTouches[0].screenX;
}, { passive: true });

track.addEventListener('touchend', (e) => {
  touchEndX = e.changedTouches[0].screenX;
  const diff = touchStartX - touchEndX;
  if (Math.abs(diff) > SWIPE_THRESHOLD) {
    if (diff > 0) { nextSlide(); }
    else { prevSlide(); }
  }
});

console.log('Medicine carousel loaded with ' + slides.length + ' items');
</script>

</body>
</html>`;
}
