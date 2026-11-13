const svgProps = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };

const ITEMS = [
  { label: "30-min delivery", icon: <svg {...svgProps}><rect x="1" y="7" width="13" height="9"></rect><path d="M14 10h4l4 3.5V16h-8z"></path><circle cx="6" cy="18" r="1.8"></circle><circle cx="17.5" cy="18" r="1.8"></circle></svg> },
  { label: "Farm-fresh quality", icon: <svg {...svgProps}><path d="M20 4C10 4 4 10 4 18c0 .8.1 1.6.3 2.3.6.3 1.4.4 2.2.4 8 0 14-6 14-14 0-.9-.1-1.7-.3-2.4"></path><path d="M6 21c2-6.5 6.5-11 12-13.5"></path></svg> },
  { label: "Secure payments", icon: <svg {...svgProps}><path d="M12 2 4 5v6c0 5 3.4 8.8 8 10 4.6-1.2 8-5 8-10V5z"></path><path d="M9 12l2 2 4-4"></path></svg> },
  { label: "Easy returns", icon: <svg {...svgProps}><path d="M3 12a9 9 0 1 0 3-6.7"></path><polyline points="3 4 3 10 9 10"></polyline></svg> },
];

export default function TrustStrip() {
  return (
    <section className="trust-strip">
      <div className="container trust-grid">
        {ITEMS.map((it) => (
          <div className="trust-item fade-up" key={it.label}>
            <span className="trust-icon" aria-hidden="true">{it.icon}</span>
            <p>{it.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
