// Atlasia signup flow — 6 iOS screens
// Tokens: marine #0d2c4a, copper #b5622e, warm bg #f8f7f4, type Playfair + Plus Jakarta

const ATL = {
  bg: '#f8f7f4',
  surface: '#ffffff',
  surface2: '#faf9f7',
  divider: '#e0ddd6',
  border: '#d4d0c8',
  text: '#18160f',
  textMuted: '#605c52',
  textFaint: '#a8a49a',
  primary: '#b5622e',
  primaryHover: '#944e22',
  primaryHl: '#f2e0d5',
  primarySubtle: '#faf3ee',
  marine: '#0d2c4a',
  marineLight: '#1a4472',
  marineHl: '#dce8f2',
  success: '#2e7d32',
  successHl: '#e8f5e9',
  display: '"Playfair Display", Georgia, serif',
  body: '"Plus Jakarta Sans", -apple-system, system-ui, sans-serif',
};

// ─────────────────────────────────────────────────────────────
// Shared bits
// ─────────────────────────────────────────────────────────────
function Screen({ children, bg = ATL.bg, dark = false }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, background: bg,
      paddingTop: 59, // status bar
      display: 'flex', flexDirection: 'column',
      fontFamily: ATL.body, color: dark ? '#fff' : ATL.text,
      WebkitFontSmoothing: 'antialiased',
    }}>{children}</div>
  );
}

function StatusBar({ dark = false }) {
  const c = dark ? '#fff' : '#000';
  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, height: 59, zIndex: 10,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '21px 32px 0',
    }}>
      <span style={{ fontFamily: '-apple-system, "SF Pro", system-ui', fontWeight: 590, fontSize: 17, color: c }}>9:41</span>
      <div style={{ width: 126 }} />
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <svg width="18" height="11" viewBox="0 0 18 11"><rect x="0" y="6.5" width="3" height="4.5" rx="0.7" fill={c}/><rect x="4.5" y="4" width="3" height="7" rx="0.7" fill={c}/><rect x="9" y="2" width="3" height="9" rx="0.7" fill={c}/><rect x="13.5" y="0" width="3" height="11" rx="0.7" fill={c}/></svg>
        <svg width="16" height="11" viewBox="0 0 16 11"><path d="M8 3C10 3 11.9 3.8 13.3 5.1L14.3 4.1C12.6 2.5 10.4 1.5 8 1.5C5.6 1.5 3.4 2.5 1.7 4.1L2.7 5.1C4.1 3.8 6 3 8 3Z" fill={c}/><circle cx="8" cy="9.5" r="1.4" fill={c}/></svg>
        <svg width="25" height="12" viewBox="0 0 25 12"><rect x="0.5" y="0.5" width="21" height="11" rx="3" stroke={c} strokeOpacity=".35" fill="none"/><rect x="2" y="2" width="18" height="8" rx="1.6" fill={c}/><path d="M23 4v4c.7-.3 1.3-1.1 1.3-2s-.6-1.7-1.3-2z" fill={c} fillOpacity=".4"/></svg>
      </div>
    </div>
  );
}

function HomeIndicator({ dark = false }) {
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, height: 34,
      display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
      paddingBottom: 8, pointerEvents: 'none', zIndex: 60,
    }}>
      <div style={{ width: 139, height: 5, borderRadius: 100, background: dark ? 'rgba(255,255,255,.7)' : 'rgba(0,0,0,.25)' }} />
    </div>
  );
}

function DynamicIsland() {
  return <div style={{ position: 'absolute', top: 11, left: '50%', transform: 'translateX(-50%)', width: 126, height: 37, borderRadius: 24, background: '#000', zIndex: 50 }} />;
}

function PrimaryButton({ children, style = {}, onClick, variant = 'primary' }) {
  const styles = {
    primary: { bg: ATL.marine, fg: '#fff' },
    copper: { bg: ATL.primary, fg: '#fff' },
    ghost: { bg: 'transparent', fg: ATL.marine, border: `1px solid ${ATL.border}` },
  }[variant];
  return (
    <button onClick={onClick} style={{
      width: '100%', height: 54, borderRadius: 14,
      background: styles.bg, color: styles.fg,
      border: styles.border || 'none',
      fontFamily: ATL.body, fontSize: 16, fontWeight: 600, letterSpacing: -0.1,
      cursor: 'pointer', ...style,
    }}>{children}</button>
  );
}

function BackChevron({ onClick, dark = false }) {
  return (
    <button onClick={onClick} style={{
      width: 40, height: 40, borderRadius: 20,
      background: dark ? 'rgba(255,255,255,.08)' : 'rgba(13,44,74,.06)',
      border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer',
    }}>
      <svg width="9" height="16" viewBox="0 0 9 16" fill="none">
        <path d="M8 1L1 8l7 7" stroke={dark ? '#fff' : ATL.marine} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  );
}

function ProgressDots({ step, total = 4 }) {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          width: i === step ? 22 : 6, height: 6, borderRadius: 3,
          background: i <= step ? ATL.marine : ATL.border,
          transition: 'all .25s',
        }} />
      ))}
    </div>
  );
}

function TopNav({ step, total, dark, onBack }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px 24px' }}>
      <BackChevron dark={dark} onClick={onBack}/>
      <ProgressDots step={step} total={total} />
      <div style={{ width: 40 }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 01 · Welcome — full-bleed property image, marine veil, copper CTA
// ─────────────────────────────────────────────────────────────
function ScreenWelcome() {
  return (
    <div style={{
      position: 'absolute', inset: 0, overflow: 'hidden',
      fontFamily: ATL.body, color: '#fff',
    }}>
      {/* Image placeholder — striped */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `repeating-linear-gradient(135deg, #2c3e50 0 18px, #34495e 18px 36px)`,
      }} />
      {/* Marine gradient overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(180deg, rgba(13,44,74,.55) 0%, rgba(13,44,74,.35) 35%, rgba(13,44,74,.95) 78%, ${ATL.marine} 100%)`,
      }} />
      {/* Mono "PROPERTY HERO" tag where image would be */}
      <div style={{
        position: 'absolute', top: 180, left: 28,
        fontFamily: 'ui-monospace, "SF Mono", monospace',
        fontSize: 10, color: 'rgba(255,255,255,.55)', letterSpacing: 1.5,
      }}>PROPERTY · HERO IMAGE</div>

      {/* content */}
      <div style={{ position: 'absolute', inset: 0, paddingTop: 59, display: 'flex', flexDirection: 'column' }}>
        {/* Logo mark */}
        <div style={{ padding: '32px 28px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(255,255,255,.12)',
            border: '1px solid rgba(255,255,255,.22)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(8px)',
          }}>
            <span style={{ fontFamily: ATL.display, fontSize: 18, fontWeight: 700, color: '#fff', lineHeight: 1 }}>A</span>
          </div>
          <span style={{ fontFamily: ATL.display, fontSize: 20, fontWeight: 600, letterSpacing: 0.4 }}>Atlasia</span>
        </div>

        <div style={{ flex: 1 }} />

        {/* Headline */}
        <div style={{ padding: '0 28px 12px' }}>
          <div style={{
            fontFamily: ATL.display, fontSize: 44, fontWeight: 500,
            lineHeight: 1.05, letterSpacing: -0.5, color: '#fff',
            textWrap: 'balance',
          }}>
            Find the<br/>
            place that<br/>
            <em style={{ fontStyle: 'italic', color: '#e7c9b3' }}>feels right.</em>
          </div>
          <div style={{
            fontSize: 15.5, lineHeight: 1.5, color: 'rgba(255,255,255,.75)',
            marginTop: 18, maxWidth: 280,
          }}>
            Curated listings, verified owners, and a quieter way to search.
          </div>
        </div>

        {/* CTAs */}
        <div style={{ padding: '24px 24px 40px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <PrimaryButton variant="copper">Create account</PrimaryButton>
          <button style={{
            height: 50, borderRadius: 14, background: 'transparent',
            color: '#fff', border: '1px solid rgba(255,255,255,.28)',
            fontFamily: ATL.body, fontSize: 15, fontWeight: 500, cursor: 'pointer',
          }}>I already have an account</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 02 · Choose role — buyer / renter / owner / agent
// ─────────────────────────────────────────────────────────────
function RoleCard({ icon, title, blurb, selected, accent }) {
  return (
    <div style={{
      background: selected ? '#fff' : ATL.surface2,
      border: `1.5px solid ${selected ? ATL.marine : ATL.divider}`,
      borderRadius: 16, padding: '16px 16px 18px',
      display: 'flex', gap: 14, alignItems: 'flex-start',
      boxShadow: selected ? '0 6px 20px rgba(13,44,74,.10)' : 'none',
      position: 'relative',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: accent || ATL.marineHl,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: ATL.text, letterSpacing: -0.1 }}>{title}</div>
        <div style={{ fontSize: 13, color: ATL.textMuted, marginTop: 3, lineHeight: 1.4 }}>{blurb}</div>
      </div>
      {/* Radio */}
      <div style={{
        width: 22, height: 22, borderRadius: 11,
        border: `2px solid ${selected ? ATL.marine : ATL.border}`,
        background: selected ? ATL.marine : '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        marginTop: 2,
      }}>
        {selected && <svg width="10" height="8" viewBox="0 0 10 8"><path d="M1 4l3 3 5-6" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </div>
    </div>
  );
}

function ScreenRole() {
  return (
    <Screen>
      <StatusBar />
      <DynamicIsland />
      <TopNav step={0} total={4} />

      <div style={{ padding: '0 28px 8px' }}>
        <div style={{ fontFamily: ATL.display, fontSize: 32, fontWeight: 500, lineHeight: 1.1, letterSpacing: -0.3 }}>
          What brings you<br/>to Atlasia?
        </div>
        <div style={{ fontSize: 14.5, color: ATL.textMuted, marginTop: 10, lineHeight: 1.45 }}>
          We'll tailor your feed and tools to match.
        </div>
      </div>

      <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        <RoleCard
          selected
          accent={ATL.primaryHl}
          icon={<svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M3 10L11 3l8 7v9a1 1 0 01-1 1h-4v-7H8v7H4a1 1 0 01-1-1v-9z" stroke={ATL.primary} strokeWidth="1.6" strokeLinejoin="round"/></svg>}
          title="I'm buying"
          blurb="Browse homes for sale and save your favourites."
        />
        <RoleCard
          accent={ATL.marineHl}
          icon={<svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="3" y="6" width="16" height="13" rx="1.5" stroke={ATL.marine} strokeWidth="1.6"/><path d="M3 9h16M8 3v4M14 3v4" stroke={ATL.marine} strokeWidth="1.6" strokeLinecap="round"/></svg>}
          title="I'm renting"
          blurb="Find rentals with verified leases and tours."
        />
        <RoleCard
          accent="#e8f0e9"
          icon={<svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M2 19h18M4 19V9l7-5 7 5v10M9 19v-6h4v6" stroke="#2e7d32" strokeWidth="1.6" strokeLinejoin="round"/></svg>}
          title="I own a property"
          blurb="List, manage tenants, and track returns."
        />
        <RoleCard
          accent="#f4e9d8"
          icon={<svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="8" r="3.5" stroke="#a87a2a" strokeWidth="1.6"/><path d="M4 19c1-3.5 4-5.5 7-5.5s6 2 7 5.5" stroke="#a87a2a" strokeWidth="1.6" strokeLinecap="round"/></svg>}
          title="I'm an agent"
          blurb="Pro tools for listings, leads, and clients."
        />
      </div>

      <div style={{ padding: '12px 20px 32px' }}>
        <PrimaryButton>Continue</PrimaryButton>
      </div>
      <HomeIndicator />
    </Screen>
  );
}

// ─────────────────────────────────────────────────────────────
// 03 · Email + password
// ─────────────────────────────────────────────────────────────
function Field({ label, value, placeholder, type = 'text', focus, hint, valid }) {
  return (
    <div>
      <div style={{ fontSize: 12.5, fontWeight: 500, color: ATL.textMuted, marginBottom: 7, letterSpacing: 0.1, textTransform: 'uppercase' }}>{label}</div>
      <div style={{
        height: 52, borderRadius: 12, background: '#fff',
        border: `1.5px solid ${focus ? ATL.marine : ATL.divider}`,
        display: 'flex', alignItems: 'center', padding: '0 16px',
        boxShadow: focus ? `0 0 0 4px ${ATL.marineHl}` : 'none',
      }}>
        <input
          readOnly
          type={type === 'password' ? 'password' : 'text'}
          value={value || ''}
          placeholder={placeholder}
          style={{
            flex: 1, border: 'none', outline: 'none', background: 'transparent',
            fontFamily: ATL.body, fontSize: 16, color: ATL.text, letterSpacing: -0.1,
          }}
        />
        {valid && (
          <svg width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="10" r="9" fill={ATL.success}/><path d="M6 10l3 3 5-6" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        )}
      </div>
      {hint && <div style={{ fontSize: 12, color: ATL.textMuted, marginTop: 7, lineHeight: 1.4 }}>{hint}</div>}
    </div>
  );
}

function ScreenEmail() {
  return (
    <Screen>
      <StatusBar />
      <DynamicIsland />
      <TopNav step={1} total={4} />

      <div style={{ padding: '0 28px' }}>
        <div style={{ fontFamily: ATL.display, fontSize: 32, fontWeight: 500, lineHeight: 1.1, letterSpacing: -0.3 }}>
          Create your<br/>account
        </div>
        <div style={{ fontSize: 14.5, color: ATL.textMuted, marginTop: 10, lineHeight: 1.45 }}>
          Use the email tied to your real estate dealings.
        </div>
      </div>

      <div style={{ padding: '32px 28px 0', display: 'flex', flexDirection: 'column', gap: 18, flex: 1 }}>
        <Field label="Email" value="amelie@maison.fr" valid />
        <Field label="Password" type="password" value="••••••••••••" focus hint="At least 10 characters, with one number." />

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 8 }}>
          <div style={{ flex: 1, height: 1, background: ATL.divider }} />
          <span style={{ fontSize: 11.5, color: ATL.textFaint, letterSpacing: 1.2, textTransform: 'uppercase' }}>or</span>
          <div style={{ flex: 1, height: 1, background: ATL.divider }} />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{
            flex: 1, height: 50, borderRadius: 12, background: '#fff',
            border: `1px solid ${ATL.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', gap: 8, fontFamily: ATL.body, fontSize: 14, fontWeight: 500, color: ATL.text,
          }}>
            <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#000" d="M14.5 9.4c0-2.5 2-3.7 2.1-3.7-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.9-3.2-.8-1.6 0-3.2 1-4 2.4-1.7 3-.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3.1 2.4 1.2-.1 1.7-.8 3.2-.8s1.9.8 3.2.8c1.3 0 2.2-1.2 3-2.4.9-1.4 1.3-2.7 1.4-2.8-.1 0-2.7-1-2.8-4z"/></svg>
            Apple
          </button>
          <button style={{
            flex: 1, height: 50, borderRadius: 12, background: '#fff',
            border: `1px solid ${ATL.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', gap: 8, fontFamily: ATL.body, fontSize: 14, fontWeight: 500, color: ATL.text,
          }}>
            <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.6 9.2c0-.6-.1-1.2-.2-1.8H9v3.4h4.8c-.2 1.1-.8 2-1.8 2.7v2.2h2.9c1.7-1.6 2.7-3.9 2.7-6.5z"/><path fill="#34A853" d="M9 18c2.4 0 4.5-.8 6-2.2l-2.9-2.2c-.8.5-1.8.9-3.1.9-2.4 0-4.4-1.6-5.1-3.8H.9v2.3C2.4 15.9 5.5 18 9 18z"/><path fill="#FBBC05" d="M3.9 10.7c-.2-.5-.3-1.1-.3-1.7s.1-1.2.3-1.7V5H.9C.3 6.2 0 7.5 0 9s.3 2.8.9 4l3-2.3z"/><path fill="#EA4335" d="M9 3.6c1.3 0 2.5.5 3.5 1.4l2.6-2.6C13.5.9 11.4 0 9 0 5.5 0 2.4 2.1.9 5l3 2.3C4.6 5.1 6.6 3.6 9 3.6z"/></svg>
            Google
          </button>
        </div>
      </div>

      <div style={{ padding: '20px 28px 24px' }}>
        <div style={{ fontSize: 11.5, color: ATL.textMuted, lineHeight: 1.5, textAlign: 'center', marginBottom: 14 }}>
          By continuing, you agree to the <span style={{ color: ATL.marine, fontWeight: 500, textDecoration: 'underline' }}>Terms</span> and <span style={{ color: ATL.marine, fontWeight: 500, textDecoration: 'underline' }}>Privacy Policy</span>.
        </div>
        <PrimaryButton>Continue</PrimaryButton>
      </div>
      <HomeIndicator />
    </Screen>
  );
}

// ─────────────────────────────────────────────────────────────
// 04 · Verify phone — OTP
// ─────────────────────────────────────────────────────────────
function ScreenVerify() {
  const code = ['4', '8', '2', '1', '', ''];
  return (
    <Screen>
      <StatusBar />
      <DynamicIsland />
      <TopNav step={2} total={4} />

      <div style={{ padding: '0 28px' }}>
        <div style={{ fontFamily: ATL.display, fontSize: 32, fontWeight: 500, lineHeight: 1.1, letterSpacing: -0.3 }}>
          Check your<br/>phone
        </div>
        <div style={{ fontSize: 14.5, color: ATL.textMuted, marginTop: 10, lineHeight: 1.45 }}>
          We sent a 6-digit code to <span style={{ color: ATL.text, fontWeight: 600 }}>+33 6 ·· ·· 42 18</span>.
        </div>
      </div>

      <div style={{ padding: '40px 24px 0', display: 'flex', justifyContent: 'center', gap: 8 }}>
        {code.map((d, i) => {
          const filled = !!d;
          const active = i === 4;
          return (
            <div key={i} style={{
              width: 46, height: 60, borderRadius: 12,
              background: filled ? '#fff' : ATL.surface2,
              border: `1.5px solid ${active ? ATL.marine : filled ? ATL.divider : ATL.divider}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: ATL.body, fontSize: 26, fontWeight: 600, color: ATL.text,
              boxShadow: active ? `0 0 0 4px ${ATL.marineHl}` : 'none',
              position: 'relative',
            }}>
              {d}
              {active && (
                <div style={{
                  position: 'absolute', width: 2, height: 28, background: ATL.marine,
                  animation: 'atl-blink 1s infinite',
                }} />
              )}
            </div>
          );
        })}
      </div>

      <div style={{ padding: '32px 28px 0', textAlign: 'center' }}>
        <div style={{ fontSize: 14, color: ATL.textMuted }}>
          Didn't get it? <span style={{ color: ATL.primary, fontWeight: 600 }}>Resend in 0:24</span>
        </div>
      </div>

      <div style={{ flex: 1 }} />

      {/* Numeric keypad */}
      <div style={{
        background: '#d1d4db', padding: '8px 4px 0',
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6,
      }}>
        {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k, i) => (
          <div key={i} style={{
            height: 44, borderRadius: 6,
            background: k === '' ? 'transparent' : '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: '-apple-system, "SF Pro", system-ui',
            fontSize: 24, fontWeight: 400, color: '#000',
            boxShadow: k === '' ? 'none' : '0 1px 0 rgba(0,0,0,.1)',
          }}>{k}</div>
        ))}
      </div>
      <div style={{ height: 34, background: '#d1d4db', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', paddingBottom: 8 }}>
        <div style={{ width: 139, height: 5, borderRadius: 100, background: 'rgba(0,0,0,.4)' }} />
      </div>

      <style>{`@keyframes atl-blink { 0%,49% { opacity: 1; } 50%,100% { opacity: 0; } }`}</style>
    </Screen>
  );
}

// ─────────────────────────────────────────────────────────────
// 05 · Preferences — set your search
// ─────────────────────────────────────────────────────────────
function Chip({ label, selected }) {
  return (
    <div style={{
      height: 38, padding: '0 16px', borderRadius: 19,
      background: selected ? ATL.marine : '#fff',
      color: selected ? '#fff' : ATL.text,
      border: `1px solid ${selected ? ATL.marine : ATL.divider}`,
      display: 'inline-flex', alignItems: 'center', gap: 6,
      fontFamily: ATL.body, fontSize: 14, fontWeight: 500,
    }}>
      {selected && <svg width="11" height="9" viewBox="0 0 11 9"><path d="M1 5l3 3 6-7" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      {label}
    </div>
  );
}

function ScreenPreferences() {
  return (
    <Screen>
      <StatusBar />
      <DynamicIsland />
      <TopNav step={3} total={4} />

      <div style={{ padding: '0 28px' }}>
        <div style={{ fontFamily: ATL.display, fontSize: 32, fontWeight: 500, lineHeight: 1.1, letterSpacing: -0.3 }}>
          Tell us what<br/>you're after
        </div>
        <div style={{ fontSize: 14.5, color: ATL.textMuted, marginTop: 10, lineHeight: 1.45 }}>
          You can change these anytime.
        </div>
      </div>

      <div style={{ padding: '28px 28px 0', flex: 1, overflow: 'auto' }}>
        {/* Section 1 */}
        <div style={{ fontSize: 12.5, fontWeight: 600, color: ATL.textMuted, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 12 }}>Property type</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
          <Chip label="Apartment" selected />
          <Chip label="House" selected />
          <Chip label="Loft" />
          <Chip label="Townhouse" />
          <Chip label="Studio" />
          <Chip label="Land" />
        </div>

        {/* Section 2 */}
        <div style={{ fontSize: 12.5, fontWeight: 600, color: ATL.textMuted, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 12 }}>Budget</div>
        <div style={{
          background: '#fff', border: `1px solid ${ATL.divider}`,
          borderRadius: 14, padding: '18px 18px 22px',
          marginBottom: 28,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 11, color: ATL.textFaint, textTransform: 'uppercase', letterSpacing: 0.5 }}>Min</div>
              <div style={{ fontFamily: ATL.display, fontSize: 22, fontWeight: 600, color: ATL.text, marginTop: 2 }}>€280k</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: ATL.textFaint, textTransform: 'uppercase', letterSpacing: 0.5 }}>Max</div>
              <div style={{ fontFamily: ATL.display, fontSize: 22, fontWeight: 600, color: ATL.text, marginTop: 2 }}>€620k</div>
            </div>
          </div>
          {/* slider */}
          <div style={{ position: 'relative', height: 6, background: ATL.surface2, borderRadius: 3 }}>
            <div style={{ position: 'absolute', left: '20%', right: '32%', top: 0, bottom: 0, background: ATL.marine, borderRadius: 3 }} />
            <div style={{ position: 'absolute', left: 'calc(20% - 11px)', top: -8, width: 22, height: 22, borderRadius: 11, background: '#fff', border: `2px solid ${ATL.marine}`, boxShadow: '0 2px 6px rgba(0,0,0,.12)' }} />
            <div style={{ position: 'absolute', right: 'calc(32% - 11px)', top: -8, width: 22, height: 22, borderRadius: 11, background: '#fff', border: `2px solid ${ATL.marine}`, boxShadow: '0 2px 6px rgba(0,0,0,.12)' }} />
          </div>
        </div>

        {/* Section 3 */}
        <div style={{ fontSize: 12.5, fontWeight: 600, color: ATL.textMuted, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 12 }}>Where</div>
        <div style={{
          height: 52, borderRadius: 12, background: '#fff',
          border: `1px solid ${ATL.divider}`,
          display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10,
          marginBottom: 12,
        }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="8" cy="8" r="6" stroke={ATL.textMuted} strokeWidth="1.6"/><path d="M16 16l-3.5-3.5" stroke={ATL.textMuted} strokeWidth="1.6" strokeLinecap="round"/></svg>
          <span style={{ fontFamily: ATL.body, fontSize: 15, color: ATL.text }}>Marrakech, Casablanca</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <Chip label="Marrakech" selected />
          <Chip label="Casablanca" selected />
          <Chip label="+ Add area" />
        </div>

        <div style={{ height: 24 }}/>
      </div>

      <div style={{ padding: '12px 24px 28px', borderTop: `1px solid ${ATL.divider}`, background: ATL.bg }}>
        <PrimaryButton>Show my matches</PrimaryButton>
      </div>
      <HomeIndicator />
    </Screen>
  );
}

// ─────────────────────────────────────────────────────────────
// 06 · Welcome / Success
// ─────────────────────────────────────────────────────────────
function ScreenSuccess() {
  return (
    <Screen bg={ATL.marine} dark>
      <StatusBar dark />
      <DynamicIsland />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 32px', textAlign: 'center' }}>
        {/* Concentric copper rings */}
        <div style={{ position: 'relative', width: 132, height: 132, marginBottom: 32 }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: 66, border: `1px solid rgba(181,98,46,.25)` }} />
          <div style={{ position: 'absolute', inset: 16, borderRadius: 50, border: `1px solid rgba(181,98,46,.4)` }} />
          <div style={{ position: 'absolute', inset: 32, borderRadius: 34, background: ATL.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 32px rgba(181,98,46,.4)' }}>
            <svg width="34" height="26" viewBox="0 0 34 26" fill="none">
              <path d="M2 13l10 10L32 3" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        <div style={{ fontFamily: ATL.display, fontSize: 38, fontWeight: 500, lineHeight: 1.05, letterSpacing: -0.4, color: '#fff', marginBottom: 14 }}>
          Welcome,<br/>
          <em style={{ fontStyle: 'italic', color: '#e7c9b3' }}>Amélie</em>.
        </div>
        <div style={{ fontSize: 15.5, color: 'rgba(255,255,255,.72)', lineHeight: 1.5, maxWidth: 280 }}>
          12 properties already match your search. Three new ones this week.
        </div>

        {/* mini stat row */}
        <div style={{
          marginTop: 36, display: 'flex', gap: 0,
          background: 'rgba(255,255,255,.06)',
          border: '1px solid rgba(255,255,255,.1)',
          borderRadius: 16, overflow: 'hidden', width: '100%',
        }}>
          {[
            { v: '12', l: 'Matches' },
            { v: '3', l: 'This week' },
            { v: '€420k', l: 'Avg. price' },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, padding: '14px 8px', textAlign: 'center', borderLeft: i ? '1px solid rgba(255,255,255,.1)' : 'none' }}>
              <div style={{ fontFamily: ATL.display, fontSize: 22, fontWeight: 600, color: '#fff' }}>{s.v}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.55)', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 2 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '12px 24px 40px' }}>
        <PrimaryButton variant="copper">Explore properties</PrimaryButton>
      </div>
      <HomeIndicator dark />
    </Screen>
  );
}

Object.assign(window, {
  ScreenWelcome, ScreenRole, ScreenEmail, ScreenVerify, ScreenPreferences, ScreenSuccess,
});
