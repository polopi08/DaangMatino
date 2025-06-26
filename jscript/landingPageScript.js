document.addEventListener("DOMContentLoaded", function () {
        // Initialize AOS animations
        AOS.init({
            duration: 800,
            easing: 'ease-out-cubic',
            once: true,
            offset: 100
        });

        // Navigation functionality
        const navLinks = document.querySelectorAll('.navbar a');
        const sections = document.querySelectorAll('section[id], footer[id]');
        const hamburger = document.getElementById('hamburger');
        const navbar = document.querySelector('.navbar');

        // Hamburger menu toggle
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navbar.classList.toggle('active');
        });

        // Close mobile menu when clicking on a link
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                hamburger.classList.remove('active');
                navbar.classList.remove('active');
            });
        });

        // Update active navigation link based on scroll position
        function updateActiveLink() {
            let currentSection = '';
            const scrollPosition = window.scrollY + 150; 

            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.offsetHeight;
                const sectionBottom = sectionTop + sectionHeight;

                if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
                    currentSection = section.id;
                }
            });

            // Special case for footer
            if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
                currentSection = 'contact';
            }

            navLinks.forEach(link => {
                link.classList.remove('active');
            });

            if (currentSection) {
                const activeLink = document.querySelector(`.navbar a[href="#${currentSection}"]`);
                if (activeLink) {
                    activeLink.classList.add('active');
                }
            }
        }

        // Smooth scrolling for navigation links
        navLinks.forEach(link => {
            link.addEventListener('click', function (e) {
                const targetId = this.getAttribute('href').substring(1);
                const targetSection = document.getElementById(targetId);
                
                if (targetSection) {
                    e.preventDefault();
                    
                    navLinks.forEach(l => l.classList.remove('active'));
                    this.classList.add('active');

                    window.scrollTo({
                        top: targetSection.offsetTop - 100,
                        behavior: 'smooth'
                    });
                }
            });
        });

        // Back to Top Button functionality
        const backToTopButton = document.getElementById('backToTop');
        
        function toggleBackToTopButton() {
            if (window.scrollY > 300) {
                backToTopButton.classList.add('visible');
            } else {
                backToTopButton.classList.remove('visible');
            }
        }

        backToTopButton.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });

        // Optimized scroll handler
        let ticking = false;
        function onScroll() {
            if (!ticking) {
                requestAnimationFrame(function() {
                    updateActiveLink();
                    toggleBackToTopButton();
                    ticking = false;
                });
                ticking = true;
            }
        }

        window.addEventListener('scroll', onScroll);
        
        // Initialize on page load
        updateActiveLink();
        toggleBackToTopButton();

        // Database functionality demo (you can expand this)
        window.addEventListener('load', async function() {
            try {
                // Example: Load some statistics for the landing page
                const stats = await DatabaseService.getReportStats();
                if (stats.success) {
                    console.log('Report statistics loaded:', stats.data);
                    // You could update the UI with real statistics here
                }
            } catch (error) {
                console.log('Database not configured yet:', error.message);
            }
        });
    });

