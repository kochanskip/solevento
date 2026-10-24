// Cards are generated into HTML. Regroup them without fetching or duplicating copy.
(() => {
    const element = document.getElementById('workshopsCarousel');
    const inner = document.getElementById('workshops-carousel-inner');
    if (!element || !inner) return;
    const cards = [...inner.querySelectorAll('.workshop-carousel-card')];
    const columns = () => window.innerWidth >= 992 ? 3 : window.innerWidth >= 768 ? 2 : 1;
    let previousColumns;
    function regroup() {
        const count = columns();
        if (count === previousColumns) return;
        const instance = window.bootstrap?.Carousel.getInstance(element);
        instance?.dispose();
        const fragment = document.createDocumentFragment();
        for (let i = 0; i < cards.length; i += count) {
            const slide = document.createElement('div');
            slide.className = 'carousel-item' + (i === 0 ? ' active' : '');
            const row = document.createElement('div');
            row.className = 'row g-4 justify-content-center';
            row.append(...cards.slice(i, i + count));
            slide.append(row);
            fragment.append(slide);
        }
        inner.replaceChildren(fragment);
        previousColumns = count;
        if (window.bootstrap) window.bootstrap.Carousel.getOrCreateInstance(element).cycle();
    }
    regroup();
    window.addEventListener('resize', regroup);
})();
