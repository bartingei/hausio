import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './LandingPage.module.css';

const STATS = [
  { value: '2,400+', label: 'Listings Verified' },
  { value: '18,000+', label: 'Tenants Helped' },
  { value: '94%', label: 'Scam-Free Rate' },
  { value: '12', label: 'Nairobi Areas Covered' },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Landlord Lists', desc: 'Landlords upload their property with photos, location, and rent. Every listing goes through our verification queue.' },
  { step: '02', title: 'We Verify', desc: 'Our admin team reviews each listing, checks for red flags, and confirms legitimacy before it goes live.' },
  { step: '03', title: 'Tenant Finds Home', desc: 'Tenants browse verified listings, contact landlords directly via WhatsApp, and move in with confidence.' },
];

const TESTIMONIALS = [
  { name: 'Wanjiku M.', role: 'Tenant, Rongai', text: 'I was scammed twice before I found Hausio. This time I moved in on the first try. The map and photos were exactly what I saw in real life.' },
  { name: 'Brian O.', role: 'Landlord, Kasarani', text: 'My bedsitter was empty for 3 months. I listed on Hausio and got a genuine tenant in 10 days. No middlemen, no commission.' },
  { name: 'Amina K.', role: 'Tenant, Kilimani', text: 'The verification badge gave me the confidence to pay the deposit. Moved in last month and everything was exactly as described.' },
];

const FAQS = [
  { q: 'Is Hausio free to use?', a: 'Yes. Tenants can browse and contact landlords completely free. Landlords list their properties at no cost during our launch phase.' },
  { q: 'How does verification work?', a: 'Every listing is manually reviewed by our admin team. We check photos, cross-reference location data, and flag suspicious pricing or descriptions.' },
  { q: 'What if I find a scam listing?', a: 'You can report any listing directly with our scam report feature. Listings with multiple reports are automatically pulled and reviewed.' },
  { q: 'Which areas are covered?', a: 'We currently focus on Nairobi — Rongai, Kasarani, Kilimani, Westlands, Embakasi, Ngong Road, and more. We expand based on demand.' },
  { q: 'How can I invest or partner with Hausio?', a: 'We are actively looking for investors and partners who believe in making housing accessible. Reach out via our contact section below.' },
];

function Counter({ target, suffix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const num = parseInt(target.replace(/\D/g, ''));
        const duration = 1800;
        const steps = 60;
        const increment = num / steps;
        let current = 0;
        const timer = setInterval(() => {
          current += increment;
          if (current >= num) { setCount(num); clearInterval(timer); }
          else setCount(Math.floor(current));
        }, duration / steps);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [donateAmount, setDonateAmount] = useState(500);

  const handleContact = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className={styles.page}>

      {/* ── NAV ── */}
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <span className={styles.logo}>hausio</span>
          <div className={styles.navLinks}>
            <a href="#how">How it works</a>
            <a href="#story">Our story</a>
            <a href="#invest">Invest</a>
            <a href="#contact">Contact</a>
          </div>
          <div className={styles.navActions}>
            <button className={styles.navLogin} onClick={() => navigate('/login')}>Log in</button>
            <button className={styles.navCta} onClick={() => navigate('/register')}>Get started</button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className={styles.hero}>
        <div className={styles.heroPattern} />
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>🏠 Nairobi's trusted rental platform</div>
          <h1 className={styles.heroTitle}>
            Find a home.<br />
            <span className={styles.heroAccent}>Not a scam.</span>
          </h1>
          <p className={styles.heroSub}>
            Hausio verifies every rental listing in Nairobi before you ever see it.
            No middlemen. No fake photos. No lost deposits.
          </p>
          <div className={styles.heroCtas}>
            <button className={styles.ctaPrimary} onClick={() => navigate('/')}>Browse Listings</button>
            <button className={styles.ctaSecondary} onClick={() => navigate('/register')}>List Your Property</button>
          </div>
          <div className={styles.heroTrust}>
            <span>✓ Verified landlords</span>
            <span>✓ Real photos</span>
            <span>✓ Exact location</span>
          </div>
        </div>
        <div className={styles.heroVisual}>
          <div className={styles.heroCard}>
            <div className={styles.heroCardImg}>
              <img src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80" alt="Nairobi apartment" />
              <span className={styles.verifiedBadge}>✓ Verified</span>
            </div>
            <div className={styles.heroCardBody}>
              <h4>Cosy 1BR in Kilimani</h4>
              <p>KES 18,000 / month</p>
              <div className={styles.heroCardTags}>
                <span>Furnished</span>
                <span>1 Bedroom</span>
              </div>
            </div>
          </div>
          <div className={`${styles.heroCard} ${styles.heroCardOffset}`}>
            <div className={styles.heroCardImg}>
              <img src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80" alt="Nairobi bedsitter" />
              <span className={styles.verifiedBadge}>✓ Verified</span>
            </div>
            <div className={styles.heroCardBody}>
              <h4>Modern Bedsitter, Rongai</h4>
              <p>KES 8,500 / month</p>
              <div className={styles.heroCardTags}>
                <span>Bedsitter</span>
                <span>Furnished</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className={styles.stats}>
        {STATS.map((s, i) => (
          <div key={i} className={styles.statItem}>
            <div className={styles.statValue}>
              <Counter target={s.value} />
              {s.value.includes('+') ? '+' : s.value.includes('%') ? '%' : ''}
            </div>
            <div className={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className={styles.section} id="how">
        <div className={styles.sectionInner}>
          <div className={styles.sectionTag}>The process</div>
          <h2 className={styles.sectionTitle}>How Hausio works</h2>
          <p className={styles.sectionSub}>Three steps between you and a safe, verified home.</p>
          <div className={styles.howGrid}>
            {HOW_IT_WORKS.map((item, i) => (
              <div key={i} className={styles.howCard}>
                <div className={styles.howStep}>{item.step}</div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STORY ── */}
      <section className={styles.story} id="story">
        <div className={styles.storyInner}>
          <div className={styles.storyText}>
            <div className={styles.sectionTag}>Our story</div>
            <h2>Born out of frustration.<br />Built with purpose.</h2>
            <p>
              In 2023, a friend of ours moved to Nairobi for a new job. She paid a deposit for a bedsitter in Embakasi — wired the money, packed her bags, showed up on moving day. The landlord didn't exist. The house didn't exist. The number was disconnected.
            </p>
            <p>
              She lost KES 25,000 and three weeks of her life. She's not alone. Thousands of Nairobians face rental scams every year — fake listings, ghost landlords, inflated deposits, and houses that look nothing like the photos.
            </p>
            <p>
              We built Hausio because we believe finding a home should not feel like gambling. Every listing on Hausio is reviewed before it goes live. Every landlord is accountable. Every tenant deserves to move in with confidence.
            </p>
            <div className={styles.storySignature}>
              — The Hausio Team, Nairobi 🇰🇪
            </div>
          </div>
          <div className={styles.storyVisual}>
            <img src="https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=700&q=80" alt="Nairobi skyline" />
            <div className={styles.storyOverlay}>
              <span>Nairobi, Kenya</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionTag}>Real people</div>
          <h2 className={styles.sectionTitle}>What our users say</h2>
          <div className={styles.testimonialGrid}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className={styles.testimonialCard}>
                <div className={styles.testimonialQuote}>"</div>
                <p>{t.text}</p>
                <div className={styles.testimonialAuthor}>
                  <div className={styles.testimonialAvatar}>{t.name[0]}</div>
                  <div>
                    <strong>{t.name}</strong>
                    <span>{t.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INVEST ── */}
      <section className={styles.invest} id="invest">
        <div className={styles.investInner}>
          <div className={styles.investText}>
            <div className={styles.sectionTagLight}>For investors & partners</div>
            <h2>Back the future of<br />African housing.</h2>
            <p>
              Kenya's rental market is worth over KES 200 billion annually — and it's almost entirely unregulated, opaque, and scam-ridden. Hausio is building the trust layer that this market desperately needs.
            </p>
            <ul className={styles.investPoints}>
              <li>✦ First-mover advantage in verified Kenyan rentals</li>
              <li>✦ Scalable to Mombasa, Kisumu, Kampala, Dar es Salaam</li>
              <li>✦ Multiple revenue streams: premium listings, tenant services, data</li>
              <li>✦ Strong early traction with zero paid marketing</li>
            </ul>
            <a href="#contact" className={styles.investCta}>Talk to us about investing →</a>
          </div>
          <div className={styles.investMetrics}>
            <div className={styles.metricCard}>
              <span className={styles.metricValue}>KES 200B+</span>
              <span className={styles.metricLabel}>Annual Kenya rental market</span>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricValue}>4M+</span>
              <span className={styles.metricLabel}>Nairobi renters</span>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricValue}>1 in 3</span>
              <span className={styles.metricLabel}>Renters report scam encounters</span>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricValue}>0</span>
              <span className={styles.metricLabel}>Verified competitors</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── DONATE ── */}
      <section className={styles.section}>
        <div className={styles.donateBox}>
          <div className={styles.donateLeft}>
            <div className={styles.sectionTag}>Support the mission</div>
            <h2>Help us keep Hausio free.</h2>
            <p>
              We keep Hausio free for tenants because we believe safe housing is a right, not a luxury. Your donation helps us cover verification costs, server infrastructure, and community outreach.
            </p>
            <div className={styles.donateAmounts}>
              {[200, 500, 1000, 2500].map(a => (
                <button
                  key={a}
                  className={donateAmount === a ? styles.donateAmountActive : styles.donateAmount}
                  onClick={() => setDonateAmount(a)}
                >
                  KES {a.toLocaleString()}
                </button>
              ))}
            </div>
            <button className={styles.donateBtn}>
              Donate KES {donateAmount.toLocaleString()} via M-Pesa
            </button>
            <p className={styles.donateSub}>Every shilling goes directly to keeping the platform running.</p>
          </div>
          <div className={styles.donateRight}>
            <div className={styles.donateImpact}>
              <div className={styles.impactItem}>
                <span className={styles.impactIcon}>🔍</span>
                <div><strong>KES 200</strong><span>Funds one listing verification</span></div>
              </div>
              <div className={styles.impactItem}>
                <span className={styles.impactIcon}>📍</span>
                <div><strong>KES 500</strong><span>Covers a week of server costs</span></div>
              </div>
              <div className={styles.impactItem}>
                <span className={styles.impactIcon}>🛡️</span>
                <div><strong>KES 1,000</strong><span>Funds a scam investigation</span></div>
              </div>
              <div className={styles.impactItem}>
                <span className={styles.impactIcon}>🏘️</span>
                <div><strong>KES 2,500</strong><span>Sponsors a new neighbourhood</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionTag}>Questions</div>
          <h2 className={styles.sectionTitle}>Frequently asked</h2>
          <div className={styles.faqList}>
            {FAQS.map((f, i) => (
              <div key={i} className={styles.faqItem} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <div className={styles.faqQuestion}>
                  <span>{f.q}</span>
                  <span className={styles.faqIcon}>{openFaq === i ? '−' : '+'}</span>
                </div>
                {openFaq === i && <div className={styles.faqAnswer}>{f.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section className={styles.contact} id="contact">
        <div className={styles.contactInner}>
          <div className={styles.contactText}>
            <div className={styles.sectionTagLight}>Get in touch</div>
            <h2>Let's build this together.</h2>
            <p>Whether you're a tenant, landlord, investor, journalist, or just someone who wants to see housing in Kenya get better — we want to hear from you.</p>
            <div className={styles.contactDetails}>
              <div>📧 hello@hausio.co.ke</div>
              <div>📍 Nairobi, Kenya</div>
              <div>🐦 @hausio_ke</div>
            </div>
          </div>
          <div className={styles.contactForm}>
            {submitted ? (
              <div className={styles.successMsg}>
                <span>✓</span>
                <h3>Message received!</h3>
                <p>We'll get back to you within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleContact}>
                <input
                  placeholder="Your name"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                />
                <input
                  type="email"
                  placeholder="Email address"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                />
                <textarea
                  placeholder="Your message — tell us who you are and what you have in mind"
                  rows={5}
                  value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })}
                  required
                />
                <button type="submit">Send message →</button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerLogo}>hausio</div>
          <div className={styles.footerLinks}>
            <a href="#how">How it works</a>
            <a href="#story">Our story</a>
            <a href="#invest">Invest</a>
            <a href="#contact">Contact</a>
            <span onClick={() => navigate('/login')} style={{cursor:'pointer'}}>Log in</span>
          </div>
          <div className={styles.footerCopy}>© 2025 Hausio. Built with ❤️ in Nairobi.</div>
        </div>
      </footer>

    </div>
  );
}
