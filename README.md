# Anne Rose: Leadership & Intuitive Life Coaching

A multi-page static website for Coach Anne Rose (Toronto and online). It's fast, has no framework, and runs on any host: Netlify, Vercel, GitHub Pages, cPanel, or a Wix/Squarespace custom-code embed.

## Pages
| Page | File |
| --- | --- |
| Home | `index.html` |
| About Anne | `about.html` |
| One-on-one coaching (formats, process, Clarity Compass, FAQ) | `coaching.html` |
| Leadership coaching | `leadership.html` |
| Intuitive life coaching | `life-coaching.html` |
| Workshops, speaking & Spring Reset | `workshops.html` |
| Client stories (filterable) | `stories.html` |
| Resources: *Ignite!* and articles | `resources.html` |
| Enquiry / book a clarity call | `contact.html` |
| Not found | `404.html` |

## Editing
The pages in the repo root are **generated**. Edit the source and rebuild:

```bash
python3 _src/build.py
```

- `_src/pages/*.html`: the body of each page (the meta block at the top sets the title and description)
- `_src/partials/*.html`: shared header, footer, final call-to-action, Clarity Compass quiz, marquees
- `assets/css/main.css`: design tokens (colours, type scale, spacing) at the top, then the components
- `assets/js/site.js`: menu, header, cursor, testimonial slider, Clarity Compass quiz, multi-step enquiry form
- `assets/js/motion.js`: GSAP + ScrollTrigger animations (respects `prefers-reduced-motion`)

## Connecting the automations
Everything is set in **`assets/js/config.js`**:

- `bookingUrl`: a Calendly, Acuity or Wix Bookings link. When it's set, every "Book a clarity call" button opens it.
- `formEndpoint`: any endpoint that accepts a JSON POST (Formspree, Make.com or Zapier webhook, Basin …). From there you can set up the auto-reply, CRM entry, scheduling link and reminders. When it's empty, enquiries open a pre-filled email instead.
- `replyPromise`: the response time shown to visitors.

## Preview locally
```bash
python3 -m http.server 8080
```
Then open http://localhost:8080.
