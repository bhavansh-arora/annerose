/* ==========================================================================
   Site configuration — the only file Anne (or we) need to touch to connect
   the automations. Leave a value empty and the site falls back gracefully.
   ========================================================================== */
window.SITE_CONFIG = {
  name: "Coach Anne Rose",
  phone: "416-557-1177",
  phoneHref: "tel:+14165571177",
  email: "anne@annerose.com",
  city: "Toronto, Ontario",
  linkedin: "https://www.linkedin.com/in/coachannerose",

  /* Booking link (Calendly, Acuity, Wix Bookings, TidyCal …).
     When set, every "Book a clarity call" button opens it directly.
     When empty, buttons go to the enquiry page instead. */
  bookingUrl: "",

  /* Form endpoint that accepts a JSON POST (Formspree, Make.com / Zapier
     webhook, Basin, Getform …). This is where the automation starts:
     auto-reply email, CRM entry, scheduling link and reminders.
     When empty, the enquiry opens the visitor's email app pre-filled. */
  formEndpoint: "",

  /* Promise shown to visitors after they enquire. */
  replyPromise: "within one business day"
};
