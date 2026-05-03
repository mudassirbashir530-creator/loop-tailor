// Utility to load HTML snippets and apply active links
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Load Header
        const headerContainer = document.getElementById('header-container');
        if (headerContainer) {
            const headerRes = await fetch('header.html');
            if (headerRes.ok) {
                headerContainer.innerHTML = await headerRes.text();
                initHeader();
            }
        }

        // Load Footer
        const footerContainer = document.getElementById('footer-container');
        if (footerContainer) {
            const footerRes = await fetch('footer.html');
            if (footerRes.ok) {
                footerContainer.innerHTML = await footerRes.text();
            }
        }
    } catch (error) {
        console.error('Error loading snippets:', error);
    }
});

function initHeader() {
    // Determine active page
    let currentPath = window.location.pathname;
    if (currentPath === '/' || currentPath.endsWith('/landing/') || currentPath.endsWith('index.html')) {
        currentPath = 'index.html';
    } else {
        currentPath = currentPath.split('/').pop() || 'index.html';
    }

    // Set active link colors
    const links = document.querySelectorAll('header .nav-link, #mobile-drawer .nav-link');
    links.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPath) {
            link.classList.add('active');
        }
    });

    // Mobile menu toggle
    const menuBtn = document.getElementById('mobile-menu-btn');
    const closeBtn = document.getElementById('close-menu-btn');
    const overlay = document.getElementById('mobile-overlay');
    const drawer = document.getElementById('mobile-drawer');

    function toggleMenu() {
        const isOpen = drawer.classList.contains('open');
        if (isOpen) {
            drawer.classList.remove('open');
            overlay.classList.remove('open');
            document.body.style.overflow = '';
        } else {
            drawer.classList.add('open');
            overlay.classList.add('open');
            document.body.style.overflow = 'hidden';
        }
    }

    if (menuBtn && closeBtn && overlay && drawer) {
        menuBtn.addEventListener('click', toggleMenu);
        closeBtn.addEventListener('click', toggleMenu);
        overlay.addEventListener('click', toggleMenu);
    }
}
