const carousel = document.getElementById('carousel');
let scrollAmount = 0;


document.getElementById('next').onclick = () => {
    carousel.scrollBy({ left: 300, behavior: 'smooth' });
};


document.getElementById('prev').onclick = () => {
    carousel.scrollBy({ left: -300, behavior: 'smooth' });
};