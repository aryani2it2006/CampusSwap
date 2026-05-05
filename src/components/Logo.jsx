export default function Logo({ size = 32, showText = false, className = '', style = {} }) {
  const containerStyle = {
    position: 'relative',
    width: size,
    height: size,
    borderRadius: size * 0.25,
    background: 'linear-gradient(135deg, #7C3AED 0%, #2563EB 100%)',
    boxShadow: `
      inset 0px ${Math.max(1, size * 0.05)}px ${Math.max(1, size * 0.1)}px rgba(255, 255, 255, 0.4),
      inset 0px -${Math.max(1, size * 0.05)}px ${Math.max(1, size * 0.1)}px rgba(0, 0, 0, 0.3),
      0px ${Math.max(1, size * 0.08)}px ${Math.max(1, size * 0.15)}px rgba(0, 0, 0, 0.25)
    `,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
    ...style
  };

  const LogoIcon = (
    <div className={className} style={containerStyle}>
      <svg 
        width={size * 0.6} 
        height={size * 0.6} 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: `drop-shadow(0px ${Math.max(1, size*0.06)}px ${Math.max(1, size*0.06)}px rgba(0,0,0,0.3))` }}
      >
        <circle cx="5" cy="12" r="2.5" fill="white" />
        <circle cx="19" cy="12" r="2.5" fill="white" />
        <polygon points="13,3 8.5,13.5 12,13.5 11,21 15.5,10.5 12,10.5" fill="white" />
      </svg>
    </div>
  );

  if (!showText) return LogoIcon;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.25 }}>
      {LogoIcon}
      <div style={{ 
        fontFamily: "'Outfit', sans-serif", 
        fontSize: size * 0.65, 
        fontWeight: '700', 
        letterSpacing: '-0.02em',
        lineHeight: 1,
        whiteSpace: 'nowrap'
      }}>
        <span style={{ color: 'white' }}>Campus</span>
        <span style={{ color: '#7C3AED' }}>Swap</span>
      </div>
    </div>
  );
}
