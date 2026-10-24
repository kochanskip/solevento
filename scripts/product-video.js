// Shared playback behaviour for every product gallery.
document.querySelectorAll('.product-detail-section .carousel').forEach(carousel => {
    const videos = Array.from(carousel.querySelectorAll('video'));
    if (!videos.length) return;
    let requested = null;
    document.querySelectorAll('.video-thumb-button').forEach(button => {
        button.addEventListener('click', () => {
            const slide = carousel.querySelectorAll('.carousel-item')[Number(button.dataset.bsSlideTo)];
            requested = slide?.querySelector('video');
            if (requested && slide.classList.contains('active')) requested.play().catch(() => {});
        });
    });
    carousel.addEventListener('slid.bs.carousel', () => {
        videos.forEach(video => {
            if (!video.closest('.carousel-item').classList.contains('active')) video.pause();
            else if (video === requested) video.play().catch(() => {});
        });
        requested = null;
    });
});
