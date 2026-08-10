const app = document.getElementById('app');

const routes = {
    '/': renderHome,
    '/immigration': renderImmigration,
    '/profile': renderProfile,
    '/about': renderAbout,
    '/contact': renderContact
};

function router() {
    const path = window.location.hash.slice(1) || '/';
    const render = routes[path] || renderHome;
    window.scrollTo(0, 0);
    app.style.opacity = 0;
    setTimeout(() => {
        render();
        app.classList.add('page-transition');
        app.style.opacity = 1;
        if (typeof AOS !== 'undefined') AOS.init();
    }, 200);
}
window.addEventListener('hashchange', router);

function renderHome() {
    app.innerHTML = `
        <section class="container mx-auto px-4 mt-10">
            <div class="text-center mb-12" data-aos="fade-up">
                <h1 class="text-4xl md:text-6xl font-extrabold text-slate-800 dark:text-white mb-4">Trusted Immigration News</h1>
                <p class="text-lg text-slate-500 dark:text-slate-400 mb-8">Stay updated with the latest announcements, guides, and deadlines.</p>
                <div class="max-w-xl mx-auto relative">
                    <input type="text" placeholder="Search news, programs, guides..." class="w-full py-4 pl-12 pr-4 rounded-2xl shadow-lg border-0 focus:ring-2 focus:ring-brand-blue dark:bg-slate-800 dark:text-white">
                    <i class="bi bi-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl"></i>
                </div>
            </div>

            <div class="flex flex-wrap gap-4 justify-center mb-12" data-aos="fade-up">
                ${['P1 Program', 'P2 Program', 'SIV', 'Sponsorship', 'Family Reunification'].map(cat => `
                    <button class="px-6 py-2 bg-white dark:bg-slate-800 text-brand-blue font-medium rounded-full shadow-sm hover:bg-brand-blue hover:text-white transition">${cat}</button>
                `).join('')}
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <div class="md:col-span-2 grid grid-cols-1 gap-8">
                    <article class="premium-card p-2 flex flex-col md:flex-row" data-aos="zoom-in">
                        <img src="https://picsum.photos/600/400" class="w-full md:w-1/2 h-64 object-cover rounded-3xl" alt="Featured News">
                        <div class="p-6 flex flex-col justify-center">
                            <span class="text-brand-blue font-bold text-sm uppercase mb-2">Breaking News</span>
                            <h2 class="text-2xl font-bold text-slate-800 dark:text-white mb-3">New Policy Updates for SIV Applicants</h2>
                            <p class="text-slate-500 dark:text-slate-400 mb-4">The government has announced new processing steps for Special Immigrant Visas...</p>
                            <a href="#/immigration" class="text-brand-blue font-semibold hover:underline">Read More →</a>
                        </div>
                    </article>
                    
                    <article class="premium-card overflow-hidden md:col-span-2" data-aos="zoom-in">
                        <div class="flex flex-col md:flex-row">
                            <img src="https://picsum.photos/seed/aitech/500/400" class="w-full md:w-2/5 h-56 md:h-auto object-cover" alt="AI Technology News">
                            <div class="p-6 flex flex-col justify-center">
                                <span class="text-xs text-purple-600 dark:text-purple-400 uppercase font-bold mb-2 flex items-center gap-2">
                                    <i class="bi bi-cpu"></i> Technology News
                                </span>
                                <h3 class="text-xl md:text-2xl font-bold text-slate-800 dark:text-white mb-3 leading-tight">AI Can Find Bugs, But Human Knowledge Still Proves Them</h3>
                                <p class="text-slate-500 dark:text-slate-400 mb-4 line-clamp-3">admin-only feature does not carry the same risk as an unauthenticated internet-facing bug. A crash may be a denial of service, a path to code execution, or simply an unexploitable reliability issue, depending on the context. The only way to know is to validate...</p>
                                <button onclick="document.getElementById('tech-news-modal').classList.remove('hidden')" class="self-start text-brand-blue font-semibold hover:underline">Read More →</button>
                            </div>
                        </div>
                    </article>
                </div>

                <aside class="space-y-8">
                    <div class="premium-card p-6" data-aos="fade-left">
                        <h3 class="font-bold text-xl mb-4 text-slate-800 dark:text-white">Trending Now</h3>
                        <ul class="space-y-4">
                            ${[1, 2, 3, 4].map(i => `
                                <li class="flex gap-4 items-start cursor-pointer group">
                                    <span class="text-brand-blue font-bold text-lg">0${i}</span>
                                    <div>
                                        <p class="text-slate-600 dark:text-slate-300 group-hover:text-brand-blue transition text-sm font-medium">Family Reunification processes simplified in new directive.</p>
                                    </div>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                    <div class="premium-card p-6 bg-brand-blue text-white" data-aos="fade-left">
                        <h3 class="font-bold text-xl mb-2">Newsletter</h3>
                        <p class="text-blue-100 text-sm mb-4">Get weekly updates directly to your inbox.</p>
                        <input type="email" placeholder="Enter email" class="w-full px-4 py-2 rounded-xl text-slate-800 mb-2 outline-none">
                        <button class="w-full bg-white text-brand-blue font-bold py-2 rounded-xl hover:bg-blue-50 transition">Subscribe</button>
                    </div>
                </aside>
            </div>
        </section>

        <div id="tech-news-modal" class="hidden fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onclick="if(event.target === this) this.classList.add('hidden')">
            <div class="bg-white dark:bg-slate-800 rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-y-auto p-8 relative shadow-2xl">
                <button onclick="this.parentElement.parentElement.classList.add('hidden')" class="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-white text-3xl leading-none">&times;</button>
                <span class="text-purple-600 dark:text-purple-400 text-sm font-bold uppercase flex items-center gap-2"><i class="bi bi-cpu"></i> Technology News</span>
                <h2 class="text-3xl font-extrabold text-slate-800 dark:text-white mt-2 mb-6">AI Can Find Bugs, But Human Knowledge Still Proves Them</h2>
                <div class="text-slate-600 dark:text-slate-300 space-y-4 text-justify leading-relaxed">
                    <p>admin-only feature does not carry the same risk as an unauthenticated internet-facing bug. A crash may be a denial of service, a path to code execution, or simply an unexploitable reliability issue, depending on the context. A missing check in one code path may be serious, or it may be protected by a control somewhere else. The only way to know is to validate.</p>
                    <p>Good validation prevents both underreporting and overreporting. It helps testers avoid crying wolf, but it also gives them the evidence needed to make a strong case when the issue is genuinely serious. Tenable also recently brought up challenges in this space, including how there are often critical contextual combinations that are also missed.</p>
                    <h3 class="text-xl font-bold text-slate-800 dark:text-white pt-4">How Teams Should Use AI Without Losing Skill</h3>
                    <p>The right goal is not to avoid AI. The technology is too useful for that. The right goal is to use it in a way that strengthens offensive testing instead of weakening the people doing it. AI should help testers move faster, explore more hypotheses, and reduce repetitive work. It should not become a substitute for learning how systems behave.</p>
                    <p>Security leaders can encourage that balance by setting expectations around evidence and training. Junior testers should still learn fundamentals before they outsource too much of the process. Senior testers should use AI as a force multiplier, not as an authority. Teams should review not only whether a finding was generated, but whether the tester can explain and reproduce it. That explanation is where real understanding becomes visible.</p>
                    <p>A healthy AI-assisted offensive testing program should reward validated impact over volume. It should measure signal quality, not just finding the count. It should preserve manual practice in areas like request manipulation, code review, debugging, exploit development, threat modeling, and impact analysis. It should also use AI as a teaching tool: when the model suggests an issue, the tester should ask why, test the claim, and learn from the result.</p>
                    <h3 class="text-xl font-bold text-slate-800 dark:text-white pt-4">The Standard Has Not Changed: Prove It</h3>
                    <p>AI will continue to improve. Agents will become better at navigating applications, reading code, generating payloads, and documenting results. Some of this progress will be genuinely impressive, and security teams should take advantage of it. But offensive security cannot become a volume game where every plausible theory becomes someone else’s triage burden.</p>
                    <p>The core standard of the field is still simple: prove it. Prove the bug exists. Prove the attacker can reach it. Prove the impact. Prove the business risk. Prove the fix works. AI does not lower that standard. If anything, it raises the importance of enforcing it, because convincing but unproven output is now easier to produce than ever.</p>
                    <p>The best researchers and teams of the next decade will not be the ones that reject AI. They will be the ones who combine automation with technical judgment, using the machine to accelerate the work without handing it the final say. Knowing when to stop, inspect, test, and think will remain a competitive advantage. Knowledge still matters because validation still matters, and in offensive security, validation is the difference between noise and truth.</p>
                    <p>I will be expanding on this topic in SEC660: Advanced Penetration Testing, Exploit Writing, and Ethical Hacking at SANS Network Security 2026. Our course update blends together manual understanding of complex topics, such as exploit writing, and instructs how to leverage AI to assist in automating specific tasks.</p>
                    <p>Register for SANS Network Security here.</p>
                    <p class="text-sm italic text-slate-400 border-t border-slate-100 dark:border-slate-700 pt-4">Note: This article has been expertly written and contributed by Stephen Sims, SANS Fellow and originally appeared on...</p>
                </div>
            </div>
        </div>
    `;
}

function renderImmigration() {
    const categories = ['P1 Program', 'P2 Program', 'SIV (Special Immigrant Visa)', 'Sponsorship', 'Family Reunification'];
    app.innerHTML = `
        <section class="container mx-auto px-4 mt-10">
            <div class="mb-8" data-aos="fade-down">
                <h1 class="text-4xl font-extrabold text-slate-800 dark:text-white">Immigration Categories</h1>
                <p class="text-slate-500 dark:text-slate-400 mt-2">Select a category to view news, guides, and FAQs.</p>
            </div>
            <div class="flex flex-wrap gap-4 mb-12 border-b-2 border-slate-100 dark:border-slate-700">
                ${categories.map((cat, i) => `
                    <button onclick="filterImmigration('${cat}')" class="imm-tab px-6 py-3 font-medium text-slate-600 dark:text-slate-300 border-b-4 ${i===0 ? 'border-brand-blue text-brand-blue' : 'border-transparent'} hover:text-brand-blue transition">${cat}</button>
                `).join('')}
            </div>
            <div id="immigration-content" class="grid grid-cols-1 md:grid-cols-3 gap-8"></div>
        </section>
    `;
    filterImmigration('P1 Program');
}

function filterImmigration(category) {
    const content = document.getElementById('immigration-content');
    const tabs = document.querySelectorAll('.imm-tab');
    tabs.forEach(tab => {
        if(tab.textContent === category) {
            tab.classList.add('border-brand-blue', 'text-brand-blue');
            tab.classList.remove('border-transparent', 'text-slate-600', 'dark:text-slate-300');
        } else {
            tab.classList.remove('border-brand-blue', 'text-brand-blue');
            tab.classList.add('border-transparent', 'text-slate-600', 'dark:text-slate-300');
        }
    });
    content.innerHTML = `<div class="col-span-3 text-center py-10"><div class="skeleton h-64 w-full rounded-2xl"></div></div>`;
    setTimeout(() => {
        content.innerHTML = `
            <div class="col-span-1 md:col-span-2 grid grid-cols-1 gap-6">
                <div class="premium-card p-6" data-aos="fade-up">
                    <span class="text-brand-blue font-bold text-sm uppercase mb-2">Latest News - ${category}</span>
                    <h2 class="text-2xl font-bold text-slate-800 dark:text-white mb-3">Important Updates for ${category}</h2>
                    <p class="text-slate-500 dark:text-slate-400 mb-4">Official announcements regarding application processing and eligibility criteria for ${category} have been updated...</p>
                    <a href="#" class="text-brand-blue font-semibold hover:underline">Read More →</a>
                </div>
                <div class="premium-card p-6" data-aos="fade-up">
                    <h3 class="text-xl font-bold text-slate-800 dark:text-white mb-4">Step-by-Step Guide</h3>
                    <ol class="list-decimal list-inside space-y-2 text-slate-600 dark:text-slate-300">
                        <li>Determine Eligibility</li><li>Gather Required Documents</li><li>Submit Application Form</li><li>Attend Interview</li>
                    </ol>
                </div>
            </div>
            <div class="col-span-1 space-y-6">
                <div class="premium-card p-6" data-aos="fade-left">
                    <h3 class="font-bold text-lg mb-4 text-slate-800 dark:text-white">Important Deadlines</h3>
                    <div class="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
                        <p class="text-red-600 dark:text-red-400 font-semibold">Dec 31, 2024</p>
                        <p class="text-slate-600 dark:text-slate-300 text-sm">Final submission date for Phase 1</p>
                    </div>
                </div>
                <div class="premium-card p-6" data-aos="fade-left">
                    <h3 class="font-bold text-lg mb-4 text-slate-800 dark:text-white">Frequently Asked Questions</h3>
                    <div class="space-y-2">
                        <details class="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl cursor-pointer">
                            <summary class="font-medium text-slate-700 dark:text-white">What is ${category}?</summary>
                            <p class="text-sm text-slate-500 mt-2">It is a special immigration pathway...</p>
                        </details>
                    </div>
                </div>
            </div>
        `;
        if (typeof AOS !== 'undefined') AOS.init();
    }, 500);
}

function renderProfile() {
    app.innerHTML = `
        <section class="container mx-auto px-4 mt-10">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div class="premium-card p-6 text-center md:col-span-1 h-fit" data-aos="fade-right">
                    <img src="https://picsum.photos/150" class="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-brand-blue" alt="User Avatar">
                    <h2 class="text-xl font-bold text-slate-800 dark:text-white">Ahmad Khan</h2>
                    <p class="text-slate-400 text-sm">Premium Member</p>
                    <p class="text-slate-500 dark:text-slate-400 text-sm mt-4">Software Engineer & Immigration Activist. Sharing my journey and tips.</p>
                    <button class="w-full mt-6 py-2 border border-brand-blue text-brand-blue rounded-xl hover:bg-brand-blue hover:text-white transition">Edit Profile</button>
                </div>
                <div class="md:col-span-3 space-y-8">
                    <div class="premium-card p-6" data-aos="fade-left">
                        <h3 class="text-2xl font-bold text-slate-800 dark:text-white mb-6">Account Settings</h3>
                        <div class="space-y-4">
                            <div class="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-700">
                                <div><p class="font-medium text-slate-700 dark:text-white">Dark Mode</p><p class="text-sm text-slate-400">Toggle dark theme</p></div>
                                <button onclick="toggleTheme()" id="profile-theme-toggle" class="w-12 h-6 bg-slate-200 dark:bg-brand-blue rounded-full relative transition">
                                    <span class="absolute top-1 left-1 w-4 h-4 bg-white rounded-full dark:translate-x-6 transition"></span>
                                </button>
                            </div>
                            <div class="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-700">
                                <div><p class="font-medium text-slate-700 dark:text-white">Notifications</p><p class="text-sm text-slate-400">Email & Push alerts</p></div>
                                <input type="checkbox" checked class="w-6 h-6 text-brand-blue rounded">
                            </div>
                            <div class="flex justify-between items-center">
                                <div><p class="font-medium text-slate-700 dark:text-white">Language</p><p class="text-sm text-slate-400">Select your region</p></div>
                                <select class="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg dark:text-white"><option>English</option><option>Dari</option><option>Pashto</option></select>
                            </div>
                        </div>
                    </div>
                    <div class="premium-card p-6" data-aos="fade-left">
                        <h3 class="text-2xl font-bold text-slate-800 dark:text-white mb-6">Saved Articles & Bookmarks</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            ${[1, 2].map(i => `
                                <div class="flex gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                                    <img src="https://picsum.photos/100" class="w-20 h-20 rounded-xl object-cover" alt="Saved">
                                    <div><h4 class="font-bold text-slate-700 dark:text-white">SIV Processing Times Update</h4><p class="text-xs text-slate-400 mt-2">Saved 3 days ago</p></div>
                                </div>
                            `).join('')}
                        </div>
                        <button class="mt-6 text-red-500 font-semibold hover:underline">Logout</button>
                    </div>
                </div>
            </div>
        </section>
    `;
}

function renderAbout() {
    app.innerHTML = `
        <section class="container mx-auto px-4 mt-10">
            <div class="text-center mb-12" data-aos="fade-up">
                <h1 class="text-4xl font-extrabold text-slate-800 dark:text-white">About Sarfraz Khamoosh</h1>
                <p class="text-lg text-slate-500 dark:text-slate-400 mt-4 max-w-2xl mx-auto">Dedicated to providing accurate, timely, and life-changing immigration news and resources.</p>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                <div class="premium-card p-8" data-aos="fade-right">
                    <i class="bi bi-bullseye text-4xl text-brand-blue mb-4"></i>
                    <h2 class="text-2xl font-bold mb-4 text-slate-800 dark:text-white">Our Mission</h2>
                    <p class="text-slate-500 dark:text-slate-400">To empower immigrants with reliable information, transparent processes, and comprehensive guides to navigate their journey safely and successfully.</p>
                </div>
                <div class="premium-card p-8" data-aos="fade-left">
                    <i class="bi bi-eye text-4xl text-brand-blue mb-4"></i>
                    <h2 class="text-2xl font-bold mb-4 text-slate-800 dark:text-white">Our Vision</h2>
                    <p class="text-slate-500 dark:text-slate-400">A world where immigration processes are transparent, accessible, and every individual has the resources they need to build a better future.</p>
                </div>
            </div>
            <div class="premium-card p-8 mb-12" data-aos="fade-up">
                <h2 class="text-3xl font-bold mb-8 text-center text-slate-800 dark:text-white">Our Timeline</h2>
                <div class="relative border-l-2 border-brand-blue pl-8 ml-6 space-y-12">
                    <div><div class="absolute -left-3 w-6 h-6 bg-brand-blue rounded-full border-4 border-white dark:border-slate-900"></div><p class="text-brand-blue font-bold">2020</p><h3 class="text-xl font-bold text-slate-800 dark:text-white">Platform Founded</h3><p class="text-slate-500 dark:text-slate-400">Started as a small blog to help friends.</p></div>
                    <div><div class="absolute -left-3 w-6 h-6 bg-brand-blue rounded-full border-4 border-white dark:border-slate-900"></div><p class="text-brand-blue font-bold">2022</p><h3 class="text-xl font-bold text-slate-800 dark:text-white">10,000 Users Milestone</h3><p class="text-slate-500 dark:text-slate-400">Expanded to cover all major immigration pathways.</p></div>
                </div>
            </div>
            <div class="text-center">
                <h2 class="text-3xl font-bold mb-8 text-slate-800 dark:text-white">Meet the Team</h2>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                    ${['Founder', 'Legal Expert', 'Content Manager'].map(role => `
                        <div class="premium-card p-6 text-center" data-aos="zoom-in">
                            <img src="https://picsum.photos/150" class="w-24 h-24 rounded-full mx-auto mb-4" alt="Team Member">
                            <h3 class="font-bold text-xl text-slate-800 dark:text-white">Sarfraz Khamoosh</h3>
                            <p class="text-brand-blue">${role}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        </section>
    `;
}

function renderContact() {
    app.innerHTML = `
        <section class="container mx-auto px-4 mt-10">
            <div class="text-center mb-12" data-aos="fade-up">
                <h1 class="text-4xl font-extrabold text-slate-800 dark:text-white">Get In Touch</h1>
                <p class="text-lg text-slate-500 dark:text-slate-400 mt-4">We're here to help. Reach out with any questions.</p>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div class="premium-card p-8" data-aos="fade-right">
                    <h2 class="text-2xl font-bold mb-6 text-slate-800 dark:text-white">Send a Message</h2>
                    <form class="space-y-4">
                        <input type="text" placeholder="Your Name" class="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-brand-blue outline-none">
                        <input type="email" placeholder="Your Email" class="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-brand-blue outline-none">
                        <textarea rows="5" placeholder="Message" class="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-brand-blue outline-none"></textarea>
                        <button type="button" class="w-full py-3 bg-brand-blue text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-500/30">Send Message</button>
                    </form>
                </div>
                <div class="space-y-8" data-aos="fade-left">
                    <div class="premium-card p-6 flex items-center gap-4"><div class="p-4 bg-brand-light dark:bg-slate-700 rounded-2xl"><i class="bi bi-envelope text-2xl text-brand-blue"></i></div><div><h3 class="font-bold text-slate-800 dark:text-white">Email</h3><p class="text-slate-500 dark:text-slate-400">info@khamoosh.abrdns.com</p></div></div>
                    <div class="premium-card p-6 flex items-center gap-4"><div class="p-4 bg-brand-light dark:bg-slate-700 rounded-2xl"><i class="bi bi-telephone text-2xl text-brand-blue"></i></div><div><h3 class="font-bold text-slate-800 dark:text-white">Phone</h3><p class="text-slate-500 dark:text-slate-400">+1 (555) 123-4567</p></div></div>
                    <div class="premium-card p-6">
                        <h3 class="font-bold text-slate-800 dark:text-white mb-4">FAQ</h3>
                        <details class="mb-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl"><summary class="font-medium cursor-pointer text-slate-700 dark:text-white">How often is news updated?</summary><p class="text-sm text-slate-500 mt-2">Daily, Monday through Friday.</p></details>
                        <details class="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl"><summary class="font-medium cursor-pointer text-slate-700 dark:text-white">Do you offer legal advice?</summary><p class="text-sm text-slate-500 mt-2">No, we provide informational resources only.</p></details>
                    </div>
                </div>
            </div>
        </section>
    `;
}

// Safe Theme Toggle
function toggleTheme() {
    const html = document.documentElement;
    html.classList.toggle('dark');
    try {
        localStorage.theme = html.classList.contains('dark') ? 'dark' : 'light';
    } catch (e) {}
}

const themeToggleBtn = document.getElementById('theme-toggle-desktop');
if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', toggleTheme);
}

try {
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    }
} catch (e) {}

// Back to top button
const backToTopBtn = document.getElementById('back-to-top');
if (backToTopBtn) {
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) backToTopBtn.classList.remove('hidden');
        else backToTopBtn.classList.add('hidden');
    });
    backToTopBtn.addEventListener('click', () => window.scrollTo({top: 0, behavior: 'smooth'}));
}

// Register Service Worker Safely
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW skipped'));
    });
}

// Initialize Router
router();
