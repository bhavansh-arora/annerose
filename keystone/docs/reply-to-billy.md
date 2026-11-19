# Reply to Billy (William DePhillipo, Keystone Power Holdings)

**Subject:** Re: Ideas for your project enquiry flow (built out so you can click through)

---

Hi Billy,

Thanks for getting back to me. Rather than send a list of written ideas, we built them into a working preview of keystoneph.com. It uses your own projects, press coverage and founder bios, so you can see exactly how each idea would look and work.

**Preview:** [LINK]

It works on phones, tablets and desktop. Three things stand out:

**First, it's easy to start a project.** Today a visitor has to find the Contact page to reach you. The preview has "Start a project" and "Book a free feasibility review" throughout: in the header and top bar of every page, at the end of every page, and in a call bar that stays at the bottom of the screen on mobile. The enquiry form takes about 90 seconds and sorts each enquiry by sector, so municipal, water, school, non-profit, business and landowner leads reach you already labelled. It also routes each one by state to the right office (St. Charles, Richmond or Paoli) and flags how ready they are to move.

**Second, your projects do the selling.** Instead of uncaptioned photos, each featured project shows the client, the system size and the result they reported: Crown Holdings' 924.6 kW array offsetting about a third of the plant's power, Georgetown and Abingdon's 562 kW with 12–18%+ year-one savings, and the JCC's 223.56 kW with 20%+ annual savings. All 19 featured projects (23.9 MW) can be filtered by sector and state, four case studies carry your clients' own words, and a map shows where you've built across seven states.

**Third, your model is clear in seconds.** The no-upfront-cost approach is laid out in three simple steps: you find the site and model the savings, your fund pays for the build, and the client buys the power below utility rates. A savings estimator then lets an organization pick its sector, enter its annual electricity spend and see its estimated year-one savings, 25-year savings and system size. When they're ready, those numbers carry straight into the enquiry form.

We also added:
- **A land check for utility-scale landowners.** Four quick questions give a site fit score and an indicative MW capacity, then invite them to request a free desktop study.
- **A section for each type of client,** plus a plain-English comparison of a PPA against buying panels, and answers to the questions boards usually ask.
- **Founder profiles** for you and Anthony, built around your track records (300+ MW and Conergy Americas for Anthony, 50+ MW of distributed generation for you).

None of this replaces your existing content; it builds on what's already there. It can go live on your current domain, and the form can connect to the email or CRM you already use.

Would you have 15 minutes this week or next? I'd like to walk you through it and hear what you'd change.

Best,
Louie Villagomez
Code Bunny

---

### Before sending, check with Billy (or update on the site)
- **Savings figures:** the estimator uses the 12% to 20%+ year-one savings from Keystone's own press releases and is labeled "illustrative". Ask Billy if he'd like different ranges or a different minimum project size (the site says roughly 200 kW and up).
- **Enquiry email:** without a form endpoint, enquiries open a pre-filled email to billy@keystoneph.com (`email` in `keystone/assets/js/config.js`). Confirm which inbox or CRM (HubSpot, Salesforce and so on) leads should go to, then set `formEndpoint`.
- **Booking link:** add a scheduling link (`bookingUrl`) and the thank-you screen will offer "Book a 20-minute intro call".
- **Photos:** the project images are licensed stock photos (Unsplash / Pexels). Swap in Keystone's own project and founder photos if he has them; the founder profiles are built to look finished without photos too.
- **Reply promise:** the site says "within one business day". Change `replyPromise` if that's not right.
