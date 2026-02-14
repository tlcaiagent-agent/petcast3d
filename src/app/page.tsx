export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6" style={{fontFamily:'Fredoka', color:'var(--color-charcoal)'}}>
            Turn Your Pet Into a <span className="text-[var(--color-amber-accent)]">Masterpiece</span>
          </h1>
          <p className="text-xl text-[var(--color-soft-gray)] mb-8 max-w-2xl mx-auto">
            Upload a few photos of your furry friend and our AI sculptor will create a stunning 3D bust — then we&apos;ll print and ship it right to your door. 🐾
          </p>
          <a href="/create" className="inline-block bg-[var(--color-amber-accent)] hover:bg-[var(--color-amber-dark)] text-white font-semibold text-lg px-8 py-4 rounded-full transition-all hover:scale-105 shadow-lg">
            Create Your Pet&apos;s Bust →
          </a>
        </div>
      </section>

      {/* Example gallery */}
      <section className="py-16 px-4 bg-[var(--color-warm)]/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12" style={{fontFamily:'Fredoka'}}>Paw-some Creations</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {['🐕 Golden Retriever Bust', '🐈 Persian Cat Sculpture', '🐦 Parrot Portrait'].map((title, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-shadow">
                <div className="h-64 bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-6xl">
                  {['🐕','🐈','🐦'][i]}
                </div>
                <div className="p-4 text-center font-medium">{title}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16" style={{fontFamily:'Fredoka'}}>How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { icon: '📸', title: 'Upload Photos', desc: 'Snap 3-5 photos of your pet from different angles' },
              { icon: '🤖', title: 'AI Sculpts', desc: 'Our AI creates a detailed 3D model of your pet' },
              { icon: '👀', title: 'Preview & Approve', desc: 'Rotate and inspect your 3D bust before ordering' },
              { icon: '📦', title: 'We Print & Ship', desc: 'High-quality 3D printed bust delivered to your door' },
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className="text-5xl mb-4">{step.icon}</div>
                <div className="text-sm font-bold text-[var(--color-amber-accent)] mb-1">Step {i + 1}</div>
                <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-[var(--color-soft-gray)]">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4 bg-[var(--color-warm)]/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4" style={{fontFamily:'Fredoka'}}>Pick Your Size</h2>
          <p className="text-center text-[var(--color-soft-gray)] mb-12">All busts include free shipping & a premium gift box</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Petite Paw', size: '3" tall', price: 49, emoji: '🐾' },
              { name: 'Classic Companion', size: '5" tall', price: 79, emoji: '⭐', popular: true },
              { name: 'Majestic Mutt', size: '8" tall', price: 129, emoji: '👑' },
            ].map((tier, i) => (
              <div key={i} className={`bg-white rounded-2xl p-8 text-center shadow-md relative ${tier.popular ? 'ring-2 ring-[var(--color-amber-accent)] scale-105' : ''}`}>
                {tier.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--color-amber-accent)] text-white text-xs font-bold px-3 py-1 rounded-full">Most Popular</div>}
                <div className="text-4xl mb-3">{tier.emoji}</div>
                <h3 className="text-xl font-bold mb-1" style={{fontFamily:'Fredoka'}}>{tier.name}</h3>
                <p className="text-sm text-[var(--color-soft-gray)] mb-4">{tier.size}</p>
                <p className="text-4xl font-bold text-[var(--color-charcoal)] mb-6">${tier.price}</p>
                <a href="/create" className="inline-block w-full bg-[var(--color-amber-accent)] hover:bg-[var(--color-amber-dark)] text-white font-semibold py-3 rounded-full transition-colors">
                  Get Started
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 text-center">
        <h2 className="text-3xl font-bold mb-4" style={{fontFamily:'Fredoka'}}>Ready to Immortalize Your Pet?</h2>
        <p className="text-[var(--color-soft-gray)] mb-8">It takes less than 5 minutes. No artistic talent required. 🎨</p>
        <a href="/create" className="inline-block bg-[var(--color-amber-accent)] hover:bg-[var(--color-amber-dark)] text-white font-semibold text-lg px-8 py-4 rounded-full transition-all hover:scale-105 shadow-lg">
          Create Your Pet&apos;s Bust →
        </a>
      </section>
    </div>
  );
}
