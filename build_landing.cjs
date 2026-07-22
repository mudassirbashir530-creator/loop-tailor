const fs = require('fs');

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <rect width="120" height="120" rx="30" ry="30" fill="#1d665b"/>
  <g transform="translate(24, 24) scale(3)" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="6" cy="6" r="3"/>
    <circle cx="6" cy="18" r="3"/>
    <line x1="20" x2="8.12" y1="4" y2="15.88"/>
    <line x1="14.47" x2="20" y1="14.48" y2="20"/>
    <line x1="8.12" x2="12" y1="8.12" y2="12"/>
  </g>
</svg>
`.trim();
const b64 = Buffer.from(svg).toString('base64');
const LOGO_B64 = `data:image/svg+xml;base64,${b64}`;



const THEME = `
:root {
  --primary:    #0D3D33;
  --accent:     #2ECC71;
  --bg:         #F7F5F0;
  --card:       #FFFFFF;
  --text-h:     #0D3D33; /* Dark green for headings */
  --text-b:     #4A5568;
  --border:     rgba(13, 61, 51, 0.1);
  --caption:    #718096;
  --logo-size-header: 32px;
  --logo-size-footer: 32px;
  --max-width:  1100px;
}

body {
  background-color: var(--bg);
  color: var(--text-b);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  margin: 0;
  padding: 0;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Animations */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in-up {
  opacity: 0;
  animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.delay-100 { animation-delay: 100ms; }
.delay-200 { animation-delay: 200ms; }
.delay-300 { animation-delay: 300ms; }

* {
  box-sizing: border-box;
}

h1, h2, h3, h4, h5, h6 {
  color: var(--text-h);
  margin-top: 0;
  font-weight: 700;
  letter-spacing: -0.03em;
}

a {
  text-decoration: none;
  color: inherit;
  transition: all 0.3s ease;
}

.header {
  background-color: rgba(247, 245, 240, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  height: 72px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 5%;
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 1px solid var(--border);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
}

.header-title {
  color: var(--primary);
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.hamburger {
  background: none;
  border: none;
  color: var(--primary);
  font-size: 28px;
  cursor: pointer;
  padding: 5px;
}

.nav-menu {
  display: none;
  position: absolute;
  top: 72px;
  left: 0;
  width: 100%;
  background-color: rgba(247, 245, 240, 0.95);
  backdrop-filter: blur(20px);
  flex-direction: column;
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
}

.nav-menu.active {
  display: flex;
}

.nav-menu a {
  color: var(--primary);
  padding: 16px 5%;
  font-size: 16px;
  font-weight: 500;
  border-bottom: 1px solid var(--border);
}

.nav-menu a:last-child {
  border-bottom: none;
}

@media (min-width: 768px) {
  .nav-menu {
    display: flex;
    position: static;
    flex-direction: row;
    width: auto;
    padding: 0;
    background: transparent;
    border: none;
  }
  .hamburger {
    display: none;
  }
  .nav-menu a {
    border-bottom: none;
    padding: 0 16px;
    font-size: 15px;
  }
  .nav-menu a:hover {
    color: var(--accent);
  }
}

.footer {
  background-color: #082922; /* Darker primary */
  padding: 80px 20px 40px;
  text-align: center;
  margin-top: 80px;
}

.footer-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #FFFFFF;
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 30px;
  letter-spacing: -0.02em;
}

.footer-links {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 24px;
  margin-bottom: 40px;
}

.footer-links a {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
}
.footer-links a:hover {
  color: #FFFFFF;
}

.footer-bottom {
  color: rgba(255, 255, 255, 0.4);
  font-size: 13px;
}

.container {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 80px 20px;
}

.text-center { text-align: center; }

h1 { font-size: 48px; line-height: 1.1; margin-bottom: 20px; letter-spacing: -0.04em; }
@media (min-width: 768px) { h1 { font-size: 64px; } }
.subtitle { color: var(--text-b); font-size: 20px; margin-bottom: 40px; line-height: 1.5; font-weight: 400; }
@media (min-width: 768px) { .subtitle { font-size: 24px; } }
.caption { color: var(--caption); font-size: 15px; }

.card {
  background-color: var(--card);
  border: 1px solid var(--border);
  border-radius: 24px;
  padding: 40px;
  margin-bottom: 24px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.04);
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease;
}
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
}

/* Specific elements */
.hero-section {
  padding-top: 100px;
  padding-bottom: 60px;
}

.hero-image-wrap {
  position: relative;
  width: 140px;
  height: 140px;
  margin: 0 auto 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 40px;
  background: white;
  box-shadow: 0 20px 40px rgba(13, 61, 51, 0.08);
  padding: 24px;
}

.hero-title {
  font-size: 56px;
  font-weight: 800;
  color: var(--text-h);
  margin-bottom: 20px;
  letter-spacing: -0.04em;
  line-height: 1.1;
}
@media (min-width: 768px) { .hero-title { font-size: 72px; } }

.hero-title span {
  color: var(--accent);
}

.hero-subtitle {
  font-size: 20px;
  color: var(--text-b);
  margin-bottom: 40px;
  line-height: 1.6;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.btn-container {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-outline {
  display: inline-block;
  border: 2px solid var(--border);
  color: var(--primary);
  background: transparent;
  border-radius: 12px;
  padding: 16px 32px;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  text-align: center;
  transition: all 0.3s ease;
}
.btn-outline:hover {
  border-color: var(--primary);
  background: rgba(13, 61, 51, 0.03);
}

.btn-primary {
  display: inline-block;
  border: none;
  color: #FFFFFF;
  background: var(--primary);
  border-radius: 12px;
  padding: 16px 32px;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  text-align: center;
  transition: all 0.3s ease;
  box-shadow: 0 8px 20px rgba(13, 61, 51, 0.2);
}
.btn-primary:hover {
  background: #0a2f27;
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(13, 61, 51, 0.3);
}

.features-section {
  margin-top: 100px;
}
.features-section h2 {
  font-size: 36px;
  font-weight: 700;
  color: var(--text-h);
  margin-bottom: 40px;
}
.feature-list-wrap {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}
@media (min-width: 768px) {
  .feature-list-wrap {
    grid-template-columns: repeat(3, 1fr);
  }
}
.feature-card {
  background: var(--card);
  padding: 32px;
  border-radius: 20px;
  border: 1px solid var(--border);
  text-align: left;
  box-shadow: 0 4px 20px rgba(0,0,0,0.02);
}
.feature-card .check-icon {
  background: rgba(46, 204, 113, 0.1);
  color: var(--accent);
  width: 48px; height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  margin-bottom: 20px;
}
.feature-card h3 {
  font-size: 18px;
  margin-bottom: 12px;
}
.feature-card p {
  font-size: 15px;
  color: var(--caption);
  line-height: 1.5;
  margin: 0;
}

/* Pricing */
.pricing-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}
@media (min-width: 768px) {
  .pricing-grid {
    grid-template-columns: repeat(4, 1fr);
  }
  .pricing-card.highlight {
    transform: scale(1.05);
    z-index: 10;
  }
  .pricing-card.highlight:hover {
    transform: scale(1.05) translateY(-4px);
  }
}
.pricing-card {
  display: flex;
  flex-direction: column;
  padding: 40px 32px;
}
.pricing-card.highlight {
  border: 2px solid var(--accent);
  position: relative;
  box-shadow: 0 20px 40px rgba(46, 204, 113, 0.15);
}
.badge-popular {
  position: absolute;
  top: -14px;
  left: 50%;
  transform: translateX(-50%);
  background-color: var(--accent);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  padding: 6px 16px;
  border-radius: 20px;
  white-space: nowrap;
}
.pricing-card h2 {
  font-size: 20px;
  margin-bottom: 16px;
}
.price {
  font-size: 32px;
  font-weight: 800;
  color: var(--text-h);
  margin-bottom: 32px;
  letter-spacing: -0.03em;
}
.pricing-features {
  list-style: none;
  padding: 0;
  margin: 0 0 40px 0;
  flex-grow: 1;
}
.pricing-features li {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 15px;
  color: var(--text-b);
}
.pricing-features .check-icon {
  color: var(--accent);
  font-weight: bold;
}

/* Contact */
.contact-card {
  max-width: 540px;
  margin: 0 auto;
}
.input-group {
  margin-bottom: 24px;
  text-align: left;
}
.input-group label {
  display: block;
  font-size: 14px;
  color: var(--text-h);
  margin-bottom: 8px;
  font-weight: 600;
}
.input-control {
  width: 100%;
  padding: 14px 16px;
  border: 1px solid var(--border);
  border-radius: 12px;
  font-size: 16px;
  background-color: var(--card);
  color: var(--text-h);
  transition: all 0.2s ease;
  font-family: inherit;
}
.input-control:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(46, 204, 113, 0.2);
}
textarea.input-control {
  resize: vertical;
}

/* Policy Pages */
.policy-content {
  text-align: left;
  max-width: 800px;
  margin: 60px auto 0;
}
.policy-content .card {
  padding: 48px;
}
.policy-content h3 {
  margin-top: 32px;
  margin-bottom: 16px;
  font-size: 20px;
}
.policy-content p {
  line-height: 1.7;
  margin-bottom: 20px;
  font-size: 16px;
}
`;

const SCRIPT = `
function toggleMenu() {
  document.getElementById('nav-menu').classList.toggle('active');
}
`;

const getBaseHTML = (title, content) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Loop Tailor</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
${THEME}
    </style>
</head>
<body>
    <header class="header">
        <a href="index.html" class="header-left animate-fade-in-up">
            <img src="${LOGO_B64}" alt="LoopTailor Logo" style="width:var(--logo-size-header); height:var(--logo-size-header); border-radius:8px;">
            <div class="header-title">Loop Tailor</div>
        </a>
        <button class="hamburger" onclick="toggleMenu()" aria-label="Toggle menu">≡</button>
        <nav class="nav-menu animate-fade-in-up" id="nav-menu">
            <a href="index.html">Home</a>
            <a href="about.html">About Us</a>
            <a href="pricing.html">Pricing</a>
            <a href="contact.html">Contact</a>
        </nav>
    </header>

    <main>
${content}
    </main>

    <footer class="footer">
        <div class="footer-logo">
            <img src="${LOGO_B64}" alt="LoopTailor Logo" style="width:var(--logo-size-footer); height:var(--logo-size-footer); border-radius:8px;">
            <span>Loop Tailor</span>
        </div>
        <div class="footer-links">
            <a href="about.html">About Us</a>
            <a href="contact.html">Contact</a>
            <a href="privacy.html">Privacy</a>
            <a href="terms.html">Terms</a>
            <a href="refund.html">Refund</a>
            <a href="cookies.html">Cookies</a>
        </div>
        <div class="footer-bottom">
            © 2026 Loop Tailor. All rights reserved.
        </div>
    </footer>

    <script>
${SCRIPT}
    </script>
</body>
</html>`;

const featuresHTML = `
<div class="features-section text-center animate-fade-in-up delay-300">
    <h2>Everything you need. <br><span style="color:var(--caption)">Nothing you don't.</span></h2>
    <div class="feature-list-wrap">
        <div class="feature-card">
            <div class="check-icon">✓</div>
            <h3>Smart CMS</h3>
            <p>Manage all your customers and orders in one intuitive dashboard. Say goodbye to scattered notebooks.</p>
        </div>
        <div class="feature-card">
            <div class="check-icon">✓</div>
            <h3>Worker Assignment</h3>
            <p>Seamlessly assign tasks to your team and track progress in real-time. Keep your shop moving efficiently.</p>
        </div>
        <div class="feature-card">
            <div class="check-icon">✓</div>
            <h3>WhatsApp Integration</h3>
            <p>Automatically notify customers about order updates, trials, and pickups directly through WhatsApp.</p>
        </div>
        <div class="feature-card">
            <div class="check-icon">✓</div>
            <h3>Digital Invoices</h3>
            <p>Generate beautiful, professional invoices instantly and share them with clients with a single tap.</p>
        </div>
        <div class="feature-card">
            <div class="check-icon">✓</div>
            <h3>Image Uploads</h3>
            <p>Attach reference designs and cloth photos directly to the order. Never forget a client's request.</p>
        </div>
        <div class="feature-card">
            <div class="check-icon">✓</div>
            <h3>AI Suggestions</h3>
            <p>Get smart recommendations for styling and fabric usage tailored to your customer's measurements.</p>
        </div>
    </div>
</div>`;

const pages = {
  'index.html': {
    title: 'Home',
    content: `
<div class="container text-center hero-section">
    <div class="hero-image-wrap animate-fade-in-up">
        <img src="${LOGO_B64}" alt="LoopTailor Logo" style="width:100%; height:100%;">
    </div>
    <div class="hero-title animate-fade-in-up delay-100">Smart Software for <br><span>Modern Tailors.</span></div>
    <div class="hero-subtitle animate-fade-in-up delay-200">The most elegant and powerful way to manage your tailoring business, track orders, and delight your customers.</div>
    <div class="btn-container animate-fade-in-up delay-300">
        <a href="/login?intent=signup" class="btn-primary">Start for free</a>
        <a href="pricing.html" class="btn-outline">View pricing</a>
    </div>
    ${featuresHTML}
</div>`
  },
  'about.html': {
    title: 'About Us',
    content: `
<div class="container text-center animate-fade-in-up">
    <h1>About Us</h1>
    <div class="subtitle">Crafting the future of tailor management.</div>
    
    <div class="card text-left animate-fade-in-up delay-100" style="max-width:800px; margin:0 auto 24px auto;">
        <h3 style="font-size:24px; margin-bottom:16px;">Who We Are</h3>
        <p style="font-size:16px; line-height:1.7; color:var(--text-b);">We are a dedicated team of designers, engineers, and tailoring enthusiasts focused on bringing modern technology to traditional crafts. Our goal is to make business management effortless and beautiful for tailors everywhere.</p>
    </div>
    
    <div class="card text-left animate-fade-in-up delay-200" style="max-width:800px; margin:0 auto 80px auto;">
        <h3 style="font-size:24px; margin-bottom:16px;">Our Mission</h3>
        <p style="font-size:16px; line-height:1.7; color:var(--text-b);">To empower local tailoring businesses with smart, intuitive tools. We believe that technology should handle the paperwork elegantly, letting tailors focus entirely on their craft and their clients.</p>
    </div>

    ${featuresHTML}
</div>`
  },
  'pricing.html': {
    title: 'Pricing',
    content: `
<div class="container text-center animate-fade-in-up">
    <h1>Simple, transparent pricing.</h1>
    <div class="subtitle">No hidden fees. Cancel anytime.</div>
    
    <div class="pricing-grid text-left animate-fade-in-up delay-100" style="margin-top:60px;">
        <div class="card pricing-card highlight">
            <div class="badge-popular">Free Trial</div>
            <h2>Free Trial</h2>
            <div class="price">PKR 0<span style="font-size:16px; color:var(--caption); font-weight:500;">/mo</span></div>
            <ul class="pricing-features">
                <li><span class="check-icon">✓</span> Full access to all features</li>
                <li><span class="check-icon">✓</span> Order management</li>
                <li><span class="check-icon">✓</span> Customer management</li>
                <li><span class="check-icon">✓</span> Staff assignment</li>
                <li><span class="check-icon">✓</span> Invoice system</li>
                <li><span class="check-icon">✓</span> WhatsApp notifications</li>
            </ul>
            <a href="/login?intent=signup&plan=free-trial" target="_blank" class="btn-primary" style="width:100%; margin-top:auto;">Start Free Trial</a>
        </div>

        <div class="card pricing-card">
            <h2>Basic</h2>
            <div class="price">PKR 500<span style="font-size:16px; color:var(--caption); font-weight:500;">/mo</span></div>
            <ul class="pricing-features">
                <li><span class="check-icon">✓</span> Smart CMS</li>
                <li><span class="check-icon">✓</span> Worker Assign</li>
            </ul>
            <a href="/login?intent=signup&plan=basic" target="_blank" class="btn-outline" style="width:100%; margin-top:auto;">Get Basic</a>
        </div>
        
        <div class="card pricing-card">
            <h2>Standard</h2>
            <div class="price">PKR 1,000<span style="font-size:16px; color:var(--caption); font-weight:500;">/mo</span></div>
            <ul class="pricing-features">
                <li><span class="check-icon">✓</span> Smart CMS</li>
                <li><span class="check-icon">✓</span> Worker Assign</li>
                <li><span class="check-icon">✓</span> WhatsApp Integration</li>
            </ul>
            <a href="/login?intent=signup&plan=standard" target="_blank" class="btn-outline" style="width:100%; margin-top:auto;">Get Standard</a>
        </div>
        
        <div class="card pricing-card">
            <h2>Premium</h2>
            <div class="price">PKR 2,000<span style="font-size:16px; color:var(--caption); font-weight:500;">/mo</span></div>
            <ul class="pricing-features">
                <li><span class="check-icon">✓</span> Smart CMS</li>
                <li><span class="check-icon">✓</span> Worker Assign</li>
                <li><span class="check-icon">✓</span> WhatsApp Integration</li>
                <li><span class="check-icon">✓</span> Digital Invoices</li>
                <li><span class="check-icon">✓</span> Image Uploads</li>
            </ul>
            <a href="/login?intent=signup&plan=premium" target="_blank" class="btn-outline" style="width:100%; margin-top:auto;">Get Premium</a>
        </div>
    </div>
</div>`
  },
  'contact.html': {
    title: 'Contact Us',
    content: `
<div class="container text-center animate-fade-in-up">
    <h1>Contact Us</h1>
    <div class="subtitle">We'd love to hear from you.</div>
    
    <div class="card contact-card animate-fade-in-up delay-100" style="padding:48px;">
        <form onsubmit="event.preventDefault();">
            <div class="input-group">
                <label>Full Name</label>
                <input type="text" class="input-control" placeholder="John Doe" required />
            </div>
            <div class="input-group">
                <label>Email Address</label>
                <input type="email" class="input-control" placeholder="john@example.com" required />
            </div>
            <div class="input-group">
                <label>Message</label>
                <textarea rows="5" class="input-control" placeholder="How can we help?" required></textarea>
            </div>
            <button type="submit" class="btn-primary" style="width:100%; margin-top:8px; margin-bottom: 24px;">Send Message</button>
            <div class="caption text-center">We reply within 24 hours.</div>
        </form>
    </div>
</div>`
  },
  'privacy.html': {
    title: 'Privacy Policy',
    content: `
<div class="container text-center animate-fade-in-up">
    <h1>Privacy Policy</h1>
    <div class="caption" style="margin-top:16px;">Last updated: January 2026</div>
    <div class="policy-content animate-fade-in-up delay-100">
        <div class="card">
            <h3>1. Information We Collect</h3>
            <p>We collect information that you manually enter into the system, including your name, email, shop details, and customer measurements. We use this exclusively to provide you with the LoopTailor service in a secure manner.</p>
            
            <h3>2. How We Use Your Data</h3>
            <p>Your data is used to streamline your tailor shop's operations. We do not sell your data to any third parties. Your data is your property, and we treat it with the highest confidence and privacy standards. Our design ensures minimal data extraction and maximal privacy.</p>
            
            <h3>3. Data Security</h3>
            <p>We maintain industry-standard security measures to protect your personal information against unauthorized access, alteration, or disclosure. All data is securely stored using modern encryption protocols.</p>
        </div>
    </div>
</div>`
  },
  'terms.html': {
    title: 'Terms of Service',
    content: `
<div class="container text-center animate-fade-in-up">
    <h1>Terms of Service</h1>
    <div class="caption" style="margin-top:16px;">Last updated: January 2026</div>
    <div class="policy-content animate-fade-in-up delay-100">
        <div class="card">
            <h3>1. Acceptance of Terms</h3>
            <p>By accessing or using LoopTailor, you agree to comply with and be bound by these elegant terms. If you do not agree to these terms, please do not use our services.</p>
            
            <h3>2. Use of Service</h3>
            <p>LoopTailor provides management software for tailoring businesses. You agree to use the service only for its intended purposes and in compliance with all applicable laws and regulations.</p>
            
            <h3>3. Account Responsibilities</h3>
            <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. We treat your security as a top priority.</p>
        </div>
    </div>
</div>`
  },
  'refund.html': {
    title: 'Refund Policy',
    content: `
<div class="container text-center animate-fade-in-up">
    <h1>Refund Policy</h1>
    <div class="caption" style="margin-top:16px;">Last updated: January 2026</div>
    <div class="policy-content animate-fade-in-up delay-100">
        <div class="card">
            <h3>1. Subscription Cancellations</h3>
            <p>You may cancel your LoopTailor subscription at any time. Cancellations will take effect immediately at the end of your current billing cycle without any hidden fees.</p>
            
            <h3>2. Refunds</h3>
            <p>We do not offer pro-rated refunds for mid-billing cycle cancellations. However, if you experience significant technical issues that prevent you from using the service, please contact us for evaluation. Quality is our promise.</p>
            
            <h3>3. Evaluation Period</h3>
            <p>We recommend starting with our free trial to explore our beautifully crafted software before committing to a larger plan, ensuring it directly meets your tailoring business needs optimally.</p>
        </div>
    </div>
</div>`
  },
  'cookies.html': {
    title: 'Cookie Policy',
    content: `
<div class="container text-center animate-fade-in-up">
    <h1>Cookie Policy</h1>
    <div class="caption" style="margin-top:16px;">Last updated: January 2026</div>
    <div class="policy-content animate-fade-in-up delay-100">
        <div class="card">
            <h3>1. Essential Cookies</h3>
            <p>We use essential cookies to maintain your login session and ensure the secure, seamless operation of the LoopTailor platform. These cookies are strictly necessary.</p>
            
            <h3>2. Preference Cookies</h3>
            <p>Preference cookies may be used to remember your settings, such as language preferences or layout configurations, to provide you with a fluid experience.</p>
            
            <h3>3. Analytics</h3>
            <p>We may use minimal, privacy-respecting analytics cookies to understand how our software is being used so that we can constantly refine and improve the tools provided to our tailor community.</p>
        </div>
    </div>
</div>`
  }
};


for (const [filename, data] of Object.entries(pages)) {
  fs.writeFileSync(`public/landing/${filename}`, getBaseHTML(data.title, data.content));
}
console.log('Successfully generated all landing pages.');
