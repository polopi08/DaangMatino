    document.addEventListener("DOMContentLoaded", function () {
        const navLinks = document.querySelectorAll('.navbar a');
        const sections = document.querySelectorAll('section[id], footer[id]');

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

        let ticking = false;
        function onScroll() {
            if (!ticking) {
                requestAnimationFrame(function() {
                    updateActiveLink();
                    ticking = false;
                });
                ticking = true;
            }
        }

        window.addEventListener('scroll', onScroll);

        updateActiveLink();

        
    });

