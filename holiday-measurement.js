(function () {
    'use strict';

    const acceptedKey = 'wlHolidayEstimateAccepted';
    const attributionKey = 'wlHolidayAttribution';
    const attributionNames = ['gclid', 'gbraid', 'wbraid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
    const maxPhotoBytes = 7 * 1024 * 1024;

    function readStored(key) {
        try { return JSON.parse(sessionStorage.getItem(key)); } catch (_) { return null; }
    }
    function removeStored(key) {
        try { sessionStorage.removeItem(key); } catch (_) { /* Storage is optional. */ }
    }
    function trackAccepted(receipt) {
        if (typeof window.gtag !== 'function') return;
        window.gtag('event', 'conversion', {
            send_to: 'AW-17649723676/OAL6CK2Kx5EdEJzSheBB',
            transaction_id: receipt.id
        });
        window.gtag('event', 'generate_lead', { lead_source: 'holiday_estimate_form' });
    }

    function initialize() {
        // Discard the previous attempt-based marker; it is not evidence of acceptance.
        removeStored('wlHolidayEstimateSubmitted');
        const form = document.querySelector('form[name="holiday-estimate"]');
        if (!form) {
            const receipt = readStored(acceptedKey);
            removeStored(acceptedKey);
            const age = receipt && Date.now() - receipt.at;
            if (receipt && typeof receipt.id === 'string' && age >= 0 && age < 600000) {
                trackAccepted(receipt);
                const message = document.getElementById('thank-you-message');
                if (message) message.textContent = 'Your holiday lighting estimate request was sent successfully. The team will be in touch shortly to discuss your property.';
            }
            return;
        }

        // This callback updates the dialled number as well as the visible number.
        window.gtag('config', 'AW-17649723676/E_LdCLCKx5EdEJzSheBB', {
            phone_conversion_number: '604-907-1640',
            phone_conversion_callback: function (formattedNumber, mobileNumber) {
                document.querySelectorAll('a[data-call-location]').forEach(function (link) {
                    link.href = 'tel:' + mobileNumber;
                    link.textContent = link.textContent.includes('604-907-1640')
                        ? link.textContent.replace('604-907-1640', formattedNumber)
                        : 'Call ' + formattedNumber;
                });
            }
        });

        const params = new URLSearchParams(window.location.search);
        let attribution = readStored(attributionKey) || {};
        if (attributionNames.some(function (name) { return params.has(name); })) {
            attribution = {};
            attributionNames.forEach(function (name) { attribution[name] = (params.get(name) || '').slice(0, 500); });
            attribution.landing_page = window.location.pathname + window.location.search;
            try { sessionStorage.setItem(attributionKey, JSON.stringify(attribution)); } catch (_) { /* Continue without storage. */ }
        }
        attributionNames.concat('landing_page').forEach(function (name) {
            const field = form.elements.namedItem(name);
            if (field) field.value = attribution[name] || (name === 'landing_page' ? window.location.pathname : '');
        });

        const photo = form.elements.namedItem('photo');
        function validatePhoto() {
            const file = photo && photo.files && photo.files[0];
            if (photo) photo.setCustomValidity(file && file.size > maxPhotoBytes ? 'Please choose an image smaller than 7 MB.' : '');
        }
        if (photo) photo.addEventListener('change', validatePhoto);
        let submitting = false;
        form.addEventListener('submit', async function (event) {
            event.preventDefault();
            if (submitting) return;
            validatePhoto();
            if (!form.reportValidity()) return;
            removeStored(acceptedKey);
            const button = form.querySelector('button[type="submit"]');
            const status = document.getElementById('holiday-form-status');
            const originalLabel = button.textContent;
            const controller = new AbortController();
            const timeout = setTimeout(function () { controller.abort(); }, 30000);
            submitting = true;
            button.disabled = true;
            button.textContent = 'Sending…';
            form.setAttribute('aria-busy', 'true');
            status.textContent = 'Sending your estimate request…';
            try {
                const response = await fetch('/residential', {
                    method: 'POST', body: new FormData(form), signal: controller.signal
                });
                if (!response.ok) throw new Error('Submission not accepted');
                // Set the receipt only AFTER Netlify returns a successful response.
                const honeypot = form.elements.namedItem('bot-field');
                if (!honeypot || !honeypot.value) {
                    const receipt = {
                        at: Date.now(),
                        id: window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID() : Date.now() + '-' + Math.random().toString(36).slice(2)
                    };
                    try { sessionStorage.setItem(acceptedKey, JSON.stringify(receipt)); }
                    catch (_) { trackAccepted(receipt); }
                }
                status.textContent = 'Your request was accepted. Opening the confirmation page…';
                window.location.assign('/thank-you');
            } catch (_) {
                status.textContent = 'We could not confirm your request. Your details are still here. Please call 604-907-1640 before trying again if you are unsure whether it was sent.';
                status.focus();
                submitting = false;
                button.disabled = false;
                button.textContent = originalLabel;
                form.setAttribute('aria-busy', 'false');
            } finally {
                clearTimeout(timeout);
            }
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize);
    else initialize();
})();
