document.addEventListener('DOMContentLoaded', function() {
    
    // --- Animation Observers ---
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    const staggerObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const items = entry.target.querySelectorAll('.stagger-item');
                items.forEach((item, index) => {
                    setTimeout(() => {
                        item.classList.add('is-visible');
                    }, index * 150);
                });
                staggerObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });
    
    function observeElements(container) {
        const animatedSections = container.querySelectorAll('.fade-in-up');
        animatedSections.forEach(section => observer.observe(section));
        const staggerContainers = container.querySelectorAll('.stagger-container');
        staggerContainers.forEach(cont => staggerObserver.observe(cont));
    }
    
    observeElements(document.body);

    // --- FAQ Accordion Logic ---
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.dataset.target;
            const answer = document.querySelector(targetId);
            const icon = button.querySelector('svg');
            const isExpanded = button.getAttribute('aria-expanded') === 'true';

            faqQuestions.forEach(otherButton => {
                if (otherButton !== button) {
                    const otherTargetId = otherButton.dataset.target;
                    const otherAnswer = document.querySelector(otherTargetId);
                    otherAnswer.style.maxHeight = null;
                    otherAnswer.classList.remove('open');
                    otherButton.querySelector('svg').style.transform = 'rotate(0deg)';
                    otherButton.setAttribute('aria-expanded', 'false');
                }
            });

            if (isExpanded) {
                answer.style.maxHeight = null;
                answer.classList.remove('open');
                icon.style.transform = 'rotate(0deg)';
                button.setAttribute('aria-expanded', 'false');
            } else {
                answer.classList.add('open');
                answer.style.maxHeight = answer.scrollHeight + "px";
                icon.style.transform = 'rotate(180deg)';
                button.setAttribute('aria-expanded', 'true');
            } 
        });
    });

    // --- Form Submission Logic ---
    const contactForm = document.getElementById('contact-form');
    if (contactForm && contactForm.getAttribute('name') !== 'holiday-estimate') {
        const attributionParams = [
            'gclid',
            'gbraid',
            'wbraid',
            'utm_source',
            'utm_medium',
            'utm_campaign',
            'utm_term',
            'utm_content'
        ];
        const pageParams = new URLSearchParams(window.location.search);

        attributionParams.forEach((param) => {
            const field = contactForm.elements.namedItem(param);
            if (field) field.value = pageParams.get(param) || '';
        });

        const landingPageField = contactForm.elements.namedItem('landing_page');
        if (landingPageField) {
            landingPageField.value = `${window.location.pathname}${window.location.search}`;
        }

        const propertyPhotoField = contactForm.elements.namedItem('photo');
        if (propertyPhotoField) {
            propertyPhotoField.addEventListener('change', () => {
                const file = propertyPhotoField.files && propertyPhotoField.files[0];
                const isTooLarge = file && file.size > 8 * 1024 * 1024;
                propertyPhotoField.setCustomValidity(isTooLarge ? 'Please choose an image smaller than 8 MB.' : '');
                if (isTooLarge) propertyPhotoField.reportValidity();
            });
        }

        contactForm.addEventListener('submit', function(e) {
            // Netlify handles the actual submission. Existing pages can still
            // reveal their inline confirmation UI where those elements exist.
            setTimeout(() => {
                const wrapper = document.getElementById('contact-form-wrapper');
                const successMsg = document.getElementById('form-success-message');
                if (wrapper) wrapper.classList.add('hidden');
                if (successMsg) successMsg.classList.remove('hidden');
            }, 100);
        });
    }

    // --- Lightbox Logic ---
    const lightbox = document.getElementById('lightbox');
    if (lightbox) {
        const lightboxImg = lightbox.querySelector('img');
        const lightboxClose = document.getElementById('lightbox-close');
        const lightboxPrev = document.getElementById('lightbox-prev');
        const lightboxNext = document.getElementById('lightbox-next');
        let currentImageIndex;
        let currentGalleryItems;

        document.querySelectorAll('.gallery-item').forEach(item => {
            item.addEventListener('click', e => {
                e.preventDefault();
                const galleryId = e.currentTarget.parentElement.dataset.gallery;
                currentGalleryItems = document.querySelectorAll(`[data-gallery="${galleryId}"] .gallery-item`);
                currentImageIndex = Array.from(currentGalleryItems).indexOf(e.currentTarget);
                
                updateLightboxImage();
                lightbox.classList.add('active');
                document.body.classList.add('body-no-scroll');
            });
        });

        function updateLightboxImage() {
            const item = currentGalleryItems[currentImageIndex];
            const imgSrc = item.getAttribute('href');
            const imgAlt = item.querySelector('img').getAttribute('alt');
            lightboxImg.setAttribute('src', imgSrc);
            lightboxImg.setAttribute('alt', imgAlt);
        }

        function showPrevImage() {
            currentImageIndex = (currentImageIndex - 1 + currentGalleryItems.length) % currentGalleryItems.length;
            updateLightboxImage();
        }

        function showNextImage() {
            currentImageIndex = (currentImageIndex + 1) % currentGalleryItems.length;
            updateLightboxImage();
        }
        
        function closeLightbox() {
            lightbox.classList.remove('active');
            document.body.classList.remove('body-no-scroll');
        }

        lightboxClose.addEventListener('click', closeLightbox);
        lightboxPrev.addEventListener('click', showPrevImage);
        lightboxNext.addEventListener('click', showNextImage);
        lightbox.addEventListener('click', e => {
            if (e.target === lightbox) {
                closeLightbox();
            }
        });

        document.addEventListener('keydown', e => {
            if (lightbox.classList.contains('active')) {
                if (e.key === 'ArrowLeft') showPrevImage();
                if (e.key === 'ArrowRight') showNextImage();
                if (e.key === 'Escape') closeLightbox();
            }
        });
    }

    // --- Shrinking Header on Scroll ---
    const header = document.getElementById('header');
    const scrollOffset = 50;
    function handleScroll() {
        if (window.pageYOffset > scrollOffset) {
            header.classList.add('header-scrolled');
            header.classList.remove('header-top');
        } else {
            header.classList.remove('header-scrolled');
            header.classList.add('header-top');
        }
    }
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    
    // --- Mobile Menu ---
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    document.getElementById('year').textContent = new Date().getFullYear();
    const mobileServicesToggle = document.getElementById('mobile-services-toggle');
    const mobileServicesDropdown = document.getElementById('mobile-services-dropdown');
    const mobileServicesArrow = document.getElementById('mobile-services-arrow');

    if (mobileMenu && mobileMenuButton) {
        mobileMenuButton.addEventListener('click', () => {
            const isHidden = mobileMenu.classList.contains('hidden');
            mobileMenu.classList.toggle('hidden');
            document.body.classList.toggle('body-no-scroll', !isHidden);
            mobileMenuButton.setAttribute('aria-expanded', !isHidden);
            if (!isHidden) {
                // Find first focusable element to focus on
                const firstFocusable = mobileMenu.querySelector('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])');
                if(firstFocusable) firstFocusable.focus();
            }
        });
    }
    
    if (mobileServicesToggle && mobileServicesDropdown && mobileServicesArrow) {
        mobileServicesToggle.addEventListener('click', () => {
            mobileServicesDropdown.classList.toggle('hidden');
            mobileServicesArrow.classList.toggle('rotate-180');
        });
    }

    // Close mobile menu when a nav link is clicked
    if(mobileMenu) {
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.add('hidden');
                document.body.classList.remove('body-no-scroll');
                mobileMenuButton.setAttribute('aria-expanded', 'false');
            });
        });
    }

    // Secondary analytics only: actual Ads call conversions are counted after
    // a 60-second call through Google's forwarding-number measurement.
    document.querySelectorAll('a[href^="tel:"]').forEach((link) => {
        link.addEventListener('click', () => {
            if (typeof gtag === 'function') {
                gtag('event', 'phone_click', {
                    event_category: 'lead',
                    call_location: link.dataset.callLocation || 'unspecified'
                });
            }
        });
    });

    // --- Sparkle Effect ---
    const sparkleContainer = document.getElementById('sparkle-container');
    if (sparkleContainer) {
        for (let i = 0; i < 50; i++) {
            const sparkle = document.createElement('div');
            sparkle.classList.add('sparkle');
            sparkle.style.top = `${Math.random() * 100}%`;
            sparkle.style.left = `${Math.random() * 100}%`;
            sparkle.style.width = `${Math.random() * 2 + 1}px`;
            sparkle.style.height = sparkle.style.width;
            sparkle.style.animationDuration = `${Math.random() * 3 + 2}s`;
            sparkle.style.animationDelay = `${Math.random() * 3}s`;
            sparkleContainer.appendChild(sparkle);
        }
    }
    
    // --- Service Card hover/click for touch devices ---
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) {
        document.querySelectorAll('.service-card').forEach(card => {
            card.addEventListener('click', function(e) {
                // Allow links inside the card to work normally
                if (e.target.tagName === 'A' || e.target.closest('a')) {
                    return;
                }
                
                // Close other active cards
                document.querySelectorAll('.service-card').forEach(otherCard => {
                    if (otherCard !== this) {
                        otherCard.querySelector('.service-card-content').classList.remove('is-active');
                    }
                });

                // Toggle the current card
                this.querySelector('.service-card-content').classList.toggle('is-active');
            });
        });
    }
});
