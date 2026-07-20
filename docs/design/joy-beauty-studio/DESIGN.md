# 1. Product identity

Joy Beauty Studio is a local beauty service and booking experience at `/projects/joy-beauty-studio`. Its single job is to help a client choose a service and request a visit.

# 2. Business objective

Increase qualified booking requests by making services, duration, price, and next availability obvious before the client commits.

# 3. Audience

Local clients who value personalized beauty care, need mobile-first booking, and want proof of expertise without luxury-brand posturing.

# 4. Brand personality

Polished, warm, direct, personal, and assured. The experience should feel like an attentive studio consultation.

# 5. Visual references

Use the restraint and booking clarity of marketplace systems as behavioral reference. Use the local Joy profile for brand decisions. Do not copy another company's visual identity.

# 6. Typography system

Display: Georgia, 700, restrained editorial scale. Body and controls: Space Grotesk/system sans, 400-700. Utility labels: JetBrains Mono/system mono, 11-12px. Heading line height 0.96-1.05; body 1.55. Letter spacing is 0.

# 7. Color system

Canvas `#f7f4f1`; surface `#fffdfb`; ink `#171614`; muted `#6e6863`; petal action `#d94f62`; petal dark `#a92f42`; mineral `#315c52`; line `#d9d2cc`; white `#ffffff`. Petal is reserved for decisive booking actions. Mineral indicates care and availability.

# 8. Spacing scale

Use 4, 8, 12, 16, 24, 32, 48, 64, and 96px. Mobile section rhythm is 48-64px; desktop is 72-96px.

# 9. Grid and layout

Maximum content width 1180px with 24px mobile and 40px desktop gutters. Hero is full-bleed and 78-84vh so the next section remains visible. Service rows use a two-column editorial ledger; booking details use a stable 1fr/360px split and collapse to one column under 760px.

# 10. Components

Required: quiet brand navigation, hero booking action, availability ribbon, selectable service rows, booking summary, visit form, and confirmation state. Buttons use clear action verbs. Selected services expose state with color, border, and text.

# 11. Borders and radius

Use 1px lines. Radius scale: 0, 4, 8px. Do not use pill-shaped text containers except compact availability status.

# 12. Elevation and shadows

Use no decorative card shadows. The booking panel may use one restrained `0 18px 50px rgba(30,20,16,.10)` elevation to remain task-focused.

# 13. Icons

Use the existing project icon approach only when the symbol improves recognition. Text actions are preferred for booking commands. Maintain one stroke style and accessible names.

# 14. Photography and artwork

Use authentic salon/service photography with visible craft, client, and environment. Hero asset: `joy-beauty-studio-hero.jpg`, Siddharth Vyas, Unsplash License. Avoid generic AI faces, extreme retouching, or purely atmospheric crops.

# 15. Motion

Use 160-220ms color and transform transitions only for controls. Respect `prefers-reduced-motion`. No scroll spectacle or ambient decoration.

# 16. Responsive rules

Desktop shows service detail and booking summary side by side. Mobile uses compact navigation, left-aligned hero copy, full-width touch targets, single-column service rows, and a booking summary that follows selection. No horizontal overflow or clipped labels.

# 17. Accessibility rules

Use semantic navigation, main, sections, headings, form labels, and live confirmation. Provide visible focus, 44px minimum controls, sufficient contrast, descriptive image treatment, and reduced motion support.

# 18. Conversion hierarchy

Primary: Book your visit. Secondary: choose a service. Supporting proof: prices, duration, availability, studio approach, and real photography. Do not use unverified testimonials.

# 19. Forbidden patterns

No beige luxury template, excessive script fonts, generic purple gradients, glass cards, random neon, identical card grids, oversized empty hero, meaningless statistics, unverified testimonials, generic AI imagery, mixed icon styles, excessive animation, low-contrast text, or arbitrary font sizes.

# 20. Acceptance criteria

Business landing threshold: 85/100. Preserve `/projects/joy-beauty-studio`. Require desktop and mobile baseline/revision screenshots, working service selection and booking confirmation, clean console, responsive verification, and an independent Design Review Agent decision with no unresolved blockers.
