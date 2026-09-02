---
name: CivicNexus
colors:
  surface: '#f8f9ff'
  surface-dim: '#d0dbed'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e6eeff'
  surface-container-high: '#dee9fc'
  surface-container-highest: '#d9e3f6'
  on-surface: '#121c2a'
  on-surface-variant: '#404944'
  inverse-surface: '#27313f'
  inverse-on-surface: '#eaf1ff'
  outline: '#707974'
  outline-variant: '#bfc9c3'
  surface-tint: '#2b6954'
  primary: '#003527'
  on-primary: '#ffffff'
  primary-container: '#064e3b'
  on-primary-container: '#80bea6'
  inverse-primary: '#95d3ba'
  secondary: '#99462a'
  on-secondary: '#ffffff'
  secondary-container: '#fe9572'
  on-secondary-container: '#762c12'
  tertiary: '#4a2400'
  on-tertiary: '#ffffff'
  tertiary-container: '#6a3700'
  on-tertiary-container: '#ff9939'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#b0f0d6'
  primary-fixed-dim: '#95d3ba'
  on-primary-fixed: '#002117'
  on-primary-fixed-variant: '#0b513d'
  secondary-fixed: '#ffdbd0'
  secondary-fixed-dim: '#ffb59e'
  on-secondary-fixed: '#390b00'
  on-secondary-fixed-variant: '#7a2f15'
  tertiary-fixed: '#ffdcc3'
  tertiary-fixed-dim: '#ffb77d'
  on-tertiary-fixed: '#2f1500'
  on-tertiary-fixed-variant: '#6e3900'
  background: '#f8f9ff'
  on-background: '#121c2a'
  surface-variant: '#d9e3f6'
typography:
  display-lg:
    fontFamily: Source Serif 4
    fontSize: 56px
    fontWeight: '600'
    lineHeight: 64px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Source Serif 4
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 48px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Source Serif 4
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-md:
    fontFamily: Source Serif 4
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 64px
  max-width: 1440px
---

## Brand & Style

The design system is built for a sophisticated civic innovation platform, centering on the concept of the **Nexus**—where connection, network nodes, and the flow of information converge to foster community growth.

The aesthetic blends **Modern Civic Institutionalism** with **Light Glassmorphism**. This combination projects an image of stability and trust (institutional) while feeling transparent, innovative, and accessible (glassmorphism). The UI should evoke a sense of professional warmth, moving away from cold corporate blues toward organic, grounded tones that feel connected to the environment and the public.

**Key Visual Principles:**
- **Layered Transparency:** Using light frosted surfaces to suggest transparency in governance and open communication.
- **Node-Based Connection:** Subtle use of fine lines and geometric markers to represent the network.
- **Organic Professionalism:** A palette of deep greens and warm neutrals that feels sophisticated yet approachable.
- **Precision & Clarity:** High-quality typography and generous whitespace to handle complex data and policy information with ease.

## Colors

The "Warm Civic-Tech" palette is designed to deviate from standard government aesthetics by introducing earthen, human-centric tones.

- **Primary (Deep Forest):** Used for primary actions, navigation headers, and elements requiring the highest degree of trust.
- **Secondary (Terracotta):** Reserved for highlights, notifications, and call-to-actions that require warmth without the aggression of pure red.
- **Tertiary (Golden Amber):** Specifically utilized for achievement markers, "verified" states, and milestones.
- **Surfaces:** The background uses a soft Ivory to reduce eye strain, while secondary surfaces use a warmer Sand/Beige to define content areas.
- **Muted Sage:** Used for utility panels and secondary information that needs to be distinct but not distracting.

## Typography

The typography strategy pairs a high-authority serif with a modern, high-legibility sans-serif.

- **Headlines:** Use **Source Serif 4**. It provides an institutional, literary quality that suggests permanence and scholarly rigor. It should be used for all page titles, section headers, and significant callouts.
- **Body & Interface:** Use **Hanken Grotesk**. This font brings a contemporary, sharp technical feel to the system. Its open counters ensure readability in data-heavy dashboard views.
- **Letter Spacing:** Headlines should have a slight negative tracking to feel tighter and more "editorial," while small labels utilize positive tracking to maintain legibility at small scales.

## Layout & Spacing

The design system utilizes a **Fixed Grid** logic for desktop to maintain the "editorial" feel, transitioning to a fluid model for mobile devices.

- **Desktop Layout:** 12-column grid with a maximum width of 1440px. Content is centered. Margins are generous (64px) to emphasize the premium, spacious nature of the platform.
- **Spacing Rhythm:** Based on an 8px scale.
- **Multi-column Dashboards:** Utilize a "Side-Rail" layout where a 280px navigation column remains fixed, and the main content area utilizes nested grids for widgets.
- **Background Details:** A subtle 32px square grid pattern (10% opacity) may be applied to the base background layer to reinforce the "Nexus" network concept.

## Elevation & Depth

This design system uses **Glassmorphism** as its primary method of creating hierarchy. 

- **Surface Layers:** Elements do not "hover" with heavy shadows. Instead, they exist as translucent panes.
- **Backdrop Blur:** Surfaces should apply a `blur(10px)` effect to the background beneath them.
- **Borders:** Every glass container must have a 1px solid border. The color should be `#FFFFFF` at 30% opacity on the top and left, and 10% on the bottom and right to simulate a subtle light source.
- **Shadows:** Use only one level of "Ambient Shadow": a very soft, highly diffused shadow (`0 8px 32px rgba(6, 78, 59, 0.05)`) to lift cards slightly from the background ivory.
- **Contrast Layering:** When stacking elements (e.g., a modal over a dashboard), increase the background dimming (backdrop-filter: brightness(0.9)) rather than increasing shadow depth.

## Shapes

The shape language is **Rounded (Level 2)**, striking a balance between the precision of hard edges and the friendliness of full circles.

- **Standard Containers:** Cards and input fields use a 0.5rem (8px) radius.
- **Large Components:** Hero sections and large modal containers use 1rem (16px) radius.
- **Nexus Elements:** Specifically for status indicators, avatars, and "Impact Visualization" nodes, use full-circle (pill) rounding to represent the "Node" concept.

## Components

### Buttons
- **Primary:** Solid Deep Forest (#064E3B) with white text. No glass effect.
- **Secondary:** Transparent with a 1px border of Deep Forest.
- **Tertiary/Ghost:** No border, Deep Forest text, subtle ivory background on hover.

### Glass Cards
- Desktop-first cards with a base of `#FFFFFF` at 60% opacity. 
- Must include the standard 10px backdrop blur.
- Used for dashboard widgets and feed items.

### Impact Visualizations
- Use radial progress charts for civic goals.
- Lines connecting nodes should be 1px wide, using the Muted Sage (#94A3B8) color with a dashed stroke.

### Institutional Badges
- Small, pill-shaped tags.
- "Verified" badges use Golden Amber background with white text.
- "Project Phase" badges use Muted Sage with Deep Charcoal text.

### Inputs
- Backgrounds should be a solid Warm Beige (#F3EFE0) to ensure high text contrast.
- 1px border that shifts to Deep Forest on focus.

### Status Timelines
- Vertical lines using the "Nexus" node style: a 2px solid line with circular "nodes" at each milestone. 
- Completed milestones are filled Deep Forest; upcoming are outlined Muted Sage.