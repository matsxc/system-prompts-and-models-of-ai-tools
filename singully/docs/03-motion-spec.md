# 03. Motion spec

Library: GSAP 3.12 core + ScrollTrigger, Lenis for smooth scroll. All in `assets/js/motion.js`, initialised from `assets/js/site.js` after fonts load (`document.fonts.ready`) so split text measures correctly.

## Global rules

- Easing tokens: `--ease-out: cubic-bezier(0.16, 1, 0.3, 1)`, `--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1)`. GSAP equivalents: `"expo.out"` for reveals, `"power2.inOut"` for curtains and scrubs.
- Durations: micro 0.3s, reveal 0.9s, curtain 1.1s, preloader 1.6s total. Scrub animations have no duration, they are position bound.
- Everything that moves does one of two things: draws a line, or lifts a curtain. No bounces, no rotations, no blurs, no parallax exceeding 12% travel.
- `prefers-reduced-motion: reduce`: skip preloader, set all reveal targets to final state, keep hold to compare as instant toggle, disable Lenis.
- Return visits within the session (`sessionStorage.sin_seen`) skip the preloader.
- Mobile: same grammar, shorter travel, no cursor label, hold works with touch.

## Sequences

### M1 Preloader
1. Bone screen. A 1.5px ink line at vertical centre draws left to right, `scaleX 0 to 1`, 0.9s `power2.inOut`.
2. The wordmark Sinगली fades in hanging just beneath the line, `y 12 to 0`, `opacity 0 to 1`, 0.5s, starting at 0.6s.
3. Line and wordmark travel up together to the header position (line becomes the header rule, wordmark becomes the header logo), 0.7s `expo.inOut`. Preloader element is removed. Hero reveals start at the moment the line reaches its slot.

### M2 Hero
- Headline split into lines. Each line is wrapped in an overflow hidden mask and slides up from `y 110%`, stagger 0.08s, 0.9s `expo.out`.
- Hero media curtain lifts (`.media::after` translateY 0 to -101%), 1.1s, starting 0.2s after the first headline line.
- Media image scales from 1.14 to 1.08 during the curtain lift.
- Scroll: hero media parallax `yPercent -8` scrubbed across the first viewport.

### M3 Prologue chapter (pinned)
- Section pins for 300vh. Four manifesto lines are stacked. Line n moves from `opacity 0.15` to `1` as scroll progress passes n/4, scrub 0.4. The chapter label counter reads `00 / Prologue` and its शिरोरेखा above draws with progress.

### M4 Chapter reveals (generic)
- Any `[data-reveal]` element: `y 40 to 0`, `opacity 0 to 1`, 0.9s `expo.out`, triggered at `top 80%`, once.
- Any `[data-reveal="lines"]`: split into lines, masked slide up, stagger 0.06s.
- Any `.media[data-reveal]`: curtain lift plus scale settle as in M2.
- Any `.shirorekha[data-draw]`: `scaleX 0 to 1`, 1.2s `power2.inOut`, triggered at `top 85%`.

### M5 Hold to see the hands
- `.hold` contains `.hold__front` (garment) and `.hold__back` (making). Pointer down starts a GSAP tween on a progress value 0 to 1 over 0.7s `power2.inOut` that drives: front layer `clip-path: inset(0 0 P% 0)` rising, back layer `scale 1.06 to 1`, caption swap. Pointer up reverses the tween from its current position. Keyboard: focus the frame, hold space. Touch: same as pointer.
- A mono label under the frame reads "Hold to see the hands" and switches to the artisan credit while held.

### M6 Lane cards
- Flex row of five cards, each `flex: 1`. On hover or focus within, the hovered card animates to `flex: 2.2` with GSAP (`0.6s expo.out`), its media curtain lifts, its craft line fades in. Others compress. On mobile the row becomes a horizontal scroll snap.

### M7 The Drop (horizontal scrub)
- Desktop: the section pins for `(trackWidth - viewportWidth)` pixels and the piece row translates X with scrub 0.6. The chapter label stays. Mobile: native horizontal scroll with snap, no pin.
- Each piece card's media reveals with the M4 curtain as it enters the viewport.

### M8 The House diagram
- An SVG showing one ₹ note split into artisan share, materials, making, house. Bars draw from left with `scaleX`, stagger 0.15s, and mono figures count up with `snap: 1` over 1.2s once in view.

### M9 Cursor
- 12px ink dot follows the pointer with `lerp 0.18`. Over `[data-cursor]` it grows to a 72px ring with a mono label from the attribute (`hold`, `open`, `enter`). Hidden on touch devices and when `prefers-reduced-motion`.

### M10 Header
- Hides on downward scroll past 120px (`y -100%`, 0.4s), returns on upward scroll. Its शिरोरेखा is always present.

### M11 Footer
- The footer super rule draws on enter; the giant wordmark reveals with a masked slide up. Marquee runs continuously at 60s per loop, `animation-play-state: paused` on hover.

### M12 Page transitions
- Internal links: ink curtain rises from the bottom over 0.6s, then navigation. On the new page the curtain is present at load and lifts after fonts are ready. Skipped under reduced motion.
