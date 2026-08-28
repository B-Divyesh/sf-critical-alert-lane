# Critical Alert Lane — visual thesis

## Direction: cassette-era zine

Critical reminders should feel like a physical object placed directly in the
user's path: a fluorescent label on a mixtape, not another polite calendar
card. The product borrows the purposeful roughness of late-1980s cassette
inserts—photocopied halftones, registration marks, marker annotations, exposed
tape reels—but keeps controls crisp, large, and calm. Decoration explains the
metaphor: the “lane” is a single tape track and an active reminder is the one
signal currently playing. It never imitates a music player or adds nostalgic
clutter around essential actions.

## Palette

The app is deliberately single-mode: an ink-on-newsprint workspace with a dark
oxide-tape header. Painting the entire background explicitly keeps the zine
identity coherent and avoids an unsafe bright/dark mode switch while an alert
is active.

| Token | Value | Use |
| --- | --- | --- |
| Paper | `#F2E9D0` | main background, warm recycled stock |
| Paper high | `#FFF9E9` | inputs and raised reminder sheets |
| Oxide | `#191815` | primary ink and navigation |
| Faded ink | `#575147` | supporting text (7:1+ on paper) |
| Signal orange | `#E25B2A` | primary action, alert edge |
| Signal yellow | `#F3C84B` | focus ring and status tape |
| Acknowledged | `#276749` | success state and completion marks |
| Danger | `#9E2F26` | destructive action and errors |

Signal orange is reserved for the action that handles the current alert.
States pair color with words and symbols. All text combinations target WCAG AA
contrast; orange buttons use Oxide text rather than white.

## Type and spacing

No fonts are fetched. Headings use `Arial Black`, `Impact`, and the system
heavy sans fallback, set tightly like hand-cut zine headlines. Body and form
copy use `ui-monospace`, `SFMono-Regular`, `Cascadia Mono`, and `monospace`,
evoking typed cassette labels while retaining native rendering and a zero-byte
font budget. The scale is 16, 18, 22, 30, and clamp(40–72) px; body line-height
is 1.55 and long copy stays below 68 characters.

Spacing follows a 4/8 px rhythm: 4 micro, 8 related controls, 16 groups, 24
sections, 32 major breaks, 48 scene boundaries. Touch targets are at least
48 px. On phones, secondary metadata collapses into a compact label and the
editor becomes a full-height sheet; nothing essential is removed.

## Shape, depth, and interaction grammar

- Sheets have square-to-4 px corners, 2 px ink outlines, and a 5 px hard offset
  shadow, like pasted paper rather than generic floating cards.
- Dashed rules and crop marks communicate editing and data ownership.
- The primary alert has a vertical orange recording stripe. Acknowledge is the
  largest control; snooze remains adjacent and explicit.
- Adding/editing enters as a paper sheet from the control that opened it.
  Deleting names the reminder and requires confirmation; acknowledging is
  reversible through a short Undo notice.
- Buttons move by 2 px into their hard shadow on press and always return an
  immediate textual result in the live region.

## Motion policy

UI transitions last 180–240 ms and animate only transform/opacity. A newly due
reminder slides a few pixels along the “tape track”; the update notice fades
from its anchor. Nothing loops or flashes. Under `prefers-reduced-motion:
reduce`, all transforms, smooth scrolling, and nonessential animation are
removed; state changes remain visible through labels, outlines, and live text.

## Asset plan and prompt sheet

The hero is an original square editorial still life: a black cassette with an
orange label, one unwound strip forming a straight lane toward a checked paper
tab, rendered as tactile paper collage with coarse monochrome halftone. It
communicates one protected signal emerging from notification noise. It contains
no interface claim and is decorative alongside a descriptive caption.

Master prompt: “Editorial cassette-era zine collage, top-down black compact
cassette with blank fluorescent burnt-orange paper label, a single strip of
magnetic tape unwinds into a straight protected lane ending at one small cream
paper tab with a simple hand-drawn check mark, torn recycled newsprint,
photocopier grain, coarse black halftone dots, off-register screen print,
restricted warm cream black burnt orange and mustard palette, hard overhead
studio light, square composition, tactile analog materials, no people, no
letters, no readable text, no logos, no watermark, no brands, no gradients,
no glossy 3D render, no smartphone mockup.”

The generated source and prompt sidecar live in `assets/src/`. WebP/AVIF
derivatives live in `public/art/` with explicit dimensions. App icons are
hand-authored SVG/PNG adaptations of the tape-lane mark because vector artwork
is clearer at launcher sizes.

## Provenance

- Hero collage: generated for this product with the factory Azure OpenAI image
  deployment (`factory-image`), 2026-08-28, using the master prompt above.
  Original product asset; reviewed for accidental text, logos, anatomy, seams,
  and misleading capability. No third-party source material is shipped.
- Tape-lane icon and interface marks: original SVG/CSS artwork authored for
  Critical Alert Lane, 2026-08-28, MIT as part of the repository.
