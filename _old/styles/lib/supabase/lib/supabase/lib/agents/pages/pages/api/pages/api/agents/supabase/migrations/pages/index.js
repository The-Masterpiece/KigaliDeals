import Link from "next/link";

export default function HomePage() {
  return (
    <>
      {/* HEADER */}
      <header className="header">
        <div className="container header-inner">
          <Link href="/" className="logo">
            <span className="logo-mark">KD</span>
            <span className="logo-text">KigaliDeals</span>
          </Link>
          <nav className="nav">
            <Link href="/deals">Browse Deals</Link>
            <Link href="/business-signup">For Businesses</Link>
            <Link href="/about">About</Link>
          </nav>
          <div className="header-actions">
            <Link href="/account" className="btn btn-ghost">
              Sign In
            </Link>
            <Link href="/business-signup" className="btn btn-primary">
              List Your Business
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="hero">
        <div className="container">
          <span className="badge">🇷🇼 Made in Rwanda</span>
          <h1 className="hero-title">
            A thousand deals <br />
            on a thousand hills.
          </h1>
          <p className="hero-subtitle">
            Discover handpicked discounts from the best restaurants, spas, gyms, and
            hotels in Kigali. Pay with MoMo. Get your voucher on WhatsApp.
          </p>
          <div className="hero-actions">
            <Link href="/deals" className="btn btn-primary btn-large">
              Browse Deals
            </Link>
            <Link href="/how-it-works" className="btn btn-ghost btn-large">
              How It Works
            </Link>
          </div>
          <div className="hero-stats">
            <div className="stat">
              <div className="stat-num">50+</div>
              <div className="stat-label">Partner Businesses</div>
            </div>
            <div className="stat">
              <div className="stat-num">10</div>
              <div className="stat-label">Categories</div>
            </div>
            <div className="stat">
              <div className="stat-num">70%</div>
              <div className="stat-label">Average Savings</div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">Shop by category</h2>
          <div className="categories">
            {[
              { emoji: "🍽️", label: "Restaurants" },
              { emoji: "💆", label: "Spas & Beauty" },
              { emoji: "💪", label: "Gyms & Fitness" },
              { emoji: "🏨", label: "Hotels & Travel" },
              { emoji: "🎉", label: "Entertainment" },
              { emoji: "🛍️", label: "Shopping" },
              { emoji: "🎓", label: "Courses" },
              { emoji: "🚗", label: "Auto Services" },
            ].map((c) => (
              <Link
                key={c.label}
                href={`/deals?category=${encodeURIComponent(c.label)}`}
                className="category-card"
              >
                <span className="category-emoji">{c.emoji}</span>
                <span className="category-label">{c.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section section-alt">
        <div className="container">
          <h2 className="section-title">How it works</h2>
          <div className="steps">
            <div className="step">
              <div className="step-num">1</div>
              <h3>Find a deal</h3>
              <p>Browse discounts from trusted businesses across Kigali.</p>
            </div>
            <div className="step">
              <div className="step-num">2</div>
              <h3>Pay with MoMo</h3>
              <p>Secure payment through MTN Mobile Money. No card needed.</p>
            </div>
            <div className="step">
              <div className="step-num">3</div>
              <h3>Redeem on WhatsApp</h3>
              <p>Your voucher arrives on WhatsApp. Show it at the business.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <div className="logo">
                <span className="logo-mark">KD</span>
                <span className="logo-text">KigaliDeals</span>
              </div>
              <p className="footer-tag">A thousand deals on a thousand hills.</p>
            </div>
            <div>
              <h4>For Customers</h4>
              <Link href="/deals">Browse Deals</Link>
              <Link href="/account">My Account</Link>
              <Link href="/help">Help Center</Link>
            </div>
            <div>
              <h4>For Businesses</h4>
              <Link href="/business-signup">List Your Business</Link>
              <Link href="/merchant-resources">Merchant Resources</Link>
              <Link href="/contact">Contact Sales</Link>
            </div>
            <div>
              <h4>Company</h4>
              <Link href="/about">About</Link>
              <Link href="/terms">Terms</Link>
              <Link href="/privacy">Privacy</Link>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2026 1000 Hills Ltd. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        .header {
          background: var(--white);
          border-bottom: 1px solid var(--border);
          padding: 18px 0;
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .header-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }
        .logo {
          display: flex;
          align-items: center;
          gap: 10px;
          font-family: "Playfair Display", serif;
          font-weight: 900;
          font-size: 22px;
        }
        .logo-mark {
          background: var(--green);
          color: var(--yellow);
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          letter-spacing: -0.5px;
        }
        .nav {
          display: flex;
          gap: 32px;
          font-weight: 500;
        }
        .nav a:hover {
          color: var(--green);
        }
        .header-actions {
          display: flex;
          gap: 12px;
        }
        .hero {
          background: linear-gradient(180deg, var(--cream) 0%, var(--green-pale) 100%);
          padding: 80px 0 100px;
          text-align: center;
        }
        .hero-title {
          font-size: clamp(40px, 6vw, 72px);
          margin: 24px auto 20px;
          letter-spacing: -2px;
        }
        .hero-subtitle {
          font-size: 19px;
          color: var(--ink-2);
          max-width: 560px;
          margin: 0 auto 40px;
        }
        .hero-actions {
          display: flex;
          gap: 16px;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 60px;
        }
        .btn-large {
          padding: 16px 32px;
          font-size: 16px;
        }
        .hero-stats {
          display: flex;
          gap: 60px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .stat-num {
          font-family: "Playfair Display", serif;
          font-weight: 900;
          font-size: 48px;
          color: var(--green);
          line-height: 1;
        }
        .stat-label {
          margin-top: 6px;
          font-size: 14px;
          color: var(--muted);
        }
        .section {
          padding: 80px 0;
        }
        .section-alt {
          background: var(--white);
        }
        .section-title {
          font-size: clamp(28px, 4vw, 40px);
          text-align: center;
          margin-bottom: 48px;
        }
        .categories {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 16px;
        }
        .category-card {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 28px 16px;
          text-align: center;
          transition: all 0.2s;
        }
        .category-card:hover {
          border-color: var(--green);
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(26, 107, 60, 0.08);
        }
        .category-emoji {
          display: block;
          font-size: 36px;
          margin-bottom: 12px;
        }
        .category-label {
          font-weight: 600;
          font-size: 15px;
        }
        .steps {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 32px;
        }
        .step {
          text-align: center;
        }
        .step-num {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: var(--green);
          color: var(--yellow);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: "Playfair Display", serif;
          font-weight: 900;
          font-size: 24px;
          margin: 0 auto 20px;
        }
        .step h3 {
          font-size: 22px;
          margin-bottom: 8px;
        }
        .step p {
          color: var(--muted);
        }
        .footer {
          background: var(--ink);
          color: var(--white);
          padding: 60px 0 30px;
        }
        .footer h4 {
          color: var(--yellow);
          margin-bottom: 14px;
          font-size: 16px;
          font-family: "DM Sans", sans-serif;
          font-weight: 600;
        }
        .footer-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 48px;
          margin-bottom: 48px;
        }
        .footer-grid a {
          display: block;
          color: rgba(255, 255, 255, 0.7);
          padding: 4px 0;
          font-size: 14px;
        }
        .footer-grid a:hover {
          color: var(--yellow);
        }
        .footer-tag {
          color: rgba(255, 255, 255, 0.6);
          margin-top: 8px;
          font-size: 14px;
          font-style: italic;
        }
        .footer-bottom {
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding-top: 24px;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.5);
        }
        @media (max-width: 768px) {
          .nav {
            display: none;
          }
          .footer-grid {
            grid-template-columns: 1fr 1fr;
          }
          .hero-stats {
            gap: 32px;
          }
        }
      `}</style>
    </>
  );
}
