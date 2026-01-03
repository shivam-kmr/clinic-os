export type BlogContentBlock =
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'quote'; text: string };

export type BlogPost = {
  slug: string;
  topic: string; // bucket label
  title: string;
  excerpt: string;
  author: string;
  publishedAt: string; // ISO date
  readingTimeMinutes: number;
  content: BlogContentBlock[];
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'reduce-opd-wait-time-with-queue-visibility',
    topic: 'QUEUE MANAGEMENT',
    title: 'How to reduce OPD wait time without hiring more staff',
    excerpt:
      'OPD wait time is rarely a “doctor speed” problem. It’s usually an information + handoff problem—where patients bunch up, reception re-checks details, and delays compound across departments. This guide shows a practical queue workflow clinics can implement in days: clean check-in, a visible status for every patient, and simple rules for fairness and exceptions.',
    author: 'Clinic OS Editorial Team',
    publishedAt: '2025-12-31',
    readingTimeMinutes: 16,
    content: [
      {
        type: 'p',
        text: 'When clinics try to reduce OPD wait time, they often start by blaming “slow consultations.” But in most real clinics, the biggest delays happen before the patient meets the doctor (registration, token assignment, repeated questions) and after (lab handoffs, report status, billing). Fixing the queue is about making the entire patient journey predictable.',
      },
      {
        type: 'p',
        text: 'Here’s the uncomfortable truth: patients don’t mind waiting as much as they mind not knowing what’s happening. If the queue feels random, every 5 minutes feels like 20. If the queue feels fair and visible, even a longer wait can feel “fine.” (Yes, humans are weird. We also buy popcorn for ₹250. Same species.)',
      },
      { type: 'h2', text: 'First, identify which “wait” you actually mean' },
      {
        type: 'p',
        text: 'Clinics often say “waiting time” but mean different things. Pick the one that’s hurting you most. Otherwise, you’ll improve a number on a spreadsheet while patients still feel miserable.',
      },
      {
        type: 'ul',
        items: [
          'Door-to-doctor: from entry to consultation start (most patient-visible).',
          'Counter time: time spent at reception (most rage-inducing).',
          'Consult-to-bill: after doctor finishes → bill generated (silent chaos).',
          'Diagnostics turnaround: order placed → report ready (department bottleneck).',
        ],
      },
      { type: 'h2', text: 'The real cause: invisible work and broken handoffs' },
      {
        type: 'p',
        text: 'If a patient’s status lives in people’s heads—“I think they are next”, “I sent them to lab”, “billing is pending”—the system creates repeated back-and-forth. Patients ask for updates. Reception calls departments. Doctors wait for files. The clinic becomes noisy, not faster.',
      },
      {
        type: 'p',
        text: 'Noise is a productivity tax. Every “sir how long?” is not just a question—it’s an interruption, plus a mini-argument, plus a staff member leaving their station. Multiply that by 40 patients and you don’t have a clinic, you have a live-action WhatsApp group.',
      },
      {
        type: 'ul',
        items: [
          'Reception re-checks details because the earlier entry wasn’t complete.',
          'Patients don’t know what to do next, so they return to the counter.',
          'Departments don’t share a common “now serving” view, so calls and WhatsApp replace workflow.',
          'Billing happens at the end in a rush, creating errors and rework.',
        ],
      },
      { type: 'h2', text: 'The “queue triangle”: fairness, speed, and predictability' },
      {
        type: 'p',
        text: 'You can’t optimize only for speed. Patients care about fairness (“who came first?”) and predictability (“how long left?”). The best systems visibly balance all three.',
      },
      {
        type: 'ul',
        items: [
          'Fairness: tokens + visible ordering reduce arguments.',
          'Speed: fewer interruptions and rework improves throughput.',
          'Predictability: status + next step reduces uncertainty.',
        ],
      },
      { type: 'h2', text: 'A practical workflow that reduces waiting (without extra staff)' },
      {
        type: 'p',
        text: 'The fastest clinics run on a simple principle: every patient must have exactly one clear “current status” and exactly one “next step.” The UI can be fancy later—the discipline comes first.',
      },
      { type: 'h3', text: '1) Standardize check-in (2 minutes max)' },
      {
        type: 'p',
        text: 'Define a minimal check-in form that reception can complete quickly: patient name, phone, visit type (new/follow-up), department/doctor, and reason. Make optional fields truly optional. If check-in takes 6 minutes, the queue is already losing.',
      },
      {
        type: 'p',
        text: 'Pro tip: “optional” fields have a way of becoming “mandatory in the receptionist’s mind.” If you want speed, decide which fields matter today and which can be captured later (or never). Your queue is not the place to do a thesis on a patient’s address.',
      },
      { type: 'h3', text: '2) Create a single source of truth for “who is next”' },
      {
        type: 'p',
        text: 'If the next patient is decided by memory, the queue will feel political. Use a visible list: token number, patient name (or initials), and status. Everyone—reception, doctor, diagnostics—should see the same ordering.',
      },
      { type: 'h3', text: '2) Use tokens for fairness, appointments for predictability' },
      {
        type: 'p',
        text: 'Tokens create fairness for walk-ins; appointments create predictability for planned visits. Most clinics need both. The trick is to keep the rules simple: appointments get a window, walk-ins get a token sequence, and the doctor sees one merged queue.',
      },
      { type: 'h3', text: '2.5) Add a buffer (because reality exists)' },
      {
        type: 'p',
        text: 'Even the best doctor can’t control: complicated cases, late arrivals, emergency calls, or that one patient who starts their entire life story from 1998. Add small buffers every hour (or after every N patients) so the schedule doesn’t drift into chaos.',
      },
      { type: 'h3', text: '3) Make status visible across the clinic' },
      {
        type: 'p',
        text: 'Every department should see the same patient list with statuses like: Checked-in → Waiting → In consultation → Sent to lab → Report ready → Billing pending → Done. This reduces counter questions, reduces phone calls, and prevents “lost” patients.',
      },
      {
        type: 'p',
        text: 'If you do only one thing from this article: make “Sent to lab” and “Report ready” visible. Those two statuses eliminate a shocking amount of “is my report ready?” traffic.',
      },
      { type: 'h3', text: '4) Add two exception rules (and stop there)' },
      {
        type: 'ul',
        items: [
          'Urgent cases: allow a triage flag that moves a patient up with a visible reason.',
          'Follow-ups: optionally tag follow-ups so the doctor can batch or prioritize when appropriate.',
        ],
      },
      {
        type: 'p',
        text: 'Avoid adding 10 exception types; complexity will destroy the workflow.',
      },
      { type: 'h2', text: 'A “Monday morning” rollout checklist (no drama version)' },
      {
        type: 'p',
        text: 'Here’s how to roll this out without staff revolt. Keep it boring. Boring is good. Boring means it works.',
      },
      {
        type: 'ul',
        items: [
          'Pick 1 doctor + 1 counter + 1 diagnostic desk to pilot for 3–5 days.',
          'Define the statuses and write them on a sticky note (yes, really).',
          'Agree on the two exceptions: urgent and follow-up. Nothing else.',
          'Decide who updates which status (ownership prevents “I thought you did it”).',
          'End of day: review 10 minutes—what confused staff, what confused patients.',
        ],
      },
      { type: 'h2', text: 'What not to do (popular mistakes)' },
      {
        type: 'ul',
        items: [
          'Don’t rebuild the entire clinic workflow in one day. You’ll create confusion + resentment.',
          'Don’t make reception do data entry like an accountant. Reception is an operations role.',
          'Don’t hide the queue. Visibility reduces arguments—mystery increases them.',
          'Don’t track 25 metrics. Track 4 and actually act on them.',
        ],
      },
      { type: 'h2', text: 'What to measure weekly (so improvement is real)' },
      {
        type: 'ul',
        items: [
          'Average waiting time by hour (not a single daily average).',
          'Patients served per hour per doctor (throughput).',
          'Time from consultation end → bill generated (handoff latency).',
          'No-show rate (if using appointments).',
        ],
      },
      {
        type: 'quote',
        text: 'The goal isn’t “zero waiting.” The goal is “predictable waiting” with clear next steps.',
      },
      {
        type: 'p',
        text: 'Once you have a predictable queue, the clinic feels calmer. Staff spends less time explaining and more time executing. Patients complain less because the system feels fair and transparent. That’s how you reduce OPD wait time without hiring more staff. And yes—sometimes the best productivity “hack” is simply making the work visible.',
      },
    ],
  },
  {
    slug: 'walk-ins-and-appointments-hybrid-model',
    topic: 'APPOINTMENTS',
    title: 'Walk-ins + appointments: the hybrid model that works for Indian clinics',
    excerpt:
      'Pure appointment systems break down when walk-ins dominate. Pure tokens break down when patients expect slot certainty. The hybrid model combines both: appointments get an arrival window, walk-ins get a fair token sequence, and the clinic reserves buffers so doctors don’t fall behind. Here’s a simple setup you can run reliably.',
    author: 'Clinic OS Editorial Team',
    publishedAt: '2025-12-31',
    readingTimeMinutes: 14,
    content: [
      {
        type: 'p',
        text: 'If your clinic serves a mix of walk-ins and booked patients, the wrong scheduling model will always feel “unfair.” Walk-ins feel ignored when appointments jump ahead. Appointment patients feel cheated if they wait like walk-ins. The solution is not a perfect algorithm—it’s a simple hybrid policy that staff can execute consistently.',
      },
      {
        type: 'p',
        text: 'The goal is not “no waiting.” The goal is “less surprise.” Clinics run on trust. If people can predict what happens next, they cooperate. If not, they negotiate. And nobody wants to negotiate at 10:30am on an empty stomach.',
      },
      { type: 'h2', text: 'Why pure appointment systems fail (in the real world)' },
      {
        type: 'ul',
        items: [
          'Patients arrive early “just in case”, turning your waiting room into a pre-party.',
          'Some arrive late and still expect priority (“but I had 10:00!”).',
          'Consult times vary; one complicated case can shift the entire day.',
          'Walk-ins don’t disappear just because you printed a calendar.',
        ],
      },
      { type: 'h2', text: 'The hybrid rule set (simple and enforceable)' },
      {
        type: 'ul',
        items: [
          'Appointments are not single-minute promises. They are arrival windows (e.g., 10:00–10:20).',
          'Walk-ins receive tokens in sequence for fairness.',
          'The doctor sees one merged queue; reception controls the ordering policy.',
          'Buffers exist every hour (or after every N patients) to absorb variability.',
        ],
      },
      { type: 'h2', text: 'Set the expectation: appointments are “arrival windows”' },
      {
        type: 'p',
        text: 'If you promise “10:07am” and the doctor gets pulled into one complicated consultation, you’ve created guaranteed disappointment. Instead, communicate an arrival window: “Please arrive between 10:00–10:20.” It’s still professional, and it protects your day from collapsing.',
      },
      { type: 'h2', text: 'A simple merge policy for one queue (works surprisingly well)' },
      {
        type: 'p',
        text: 'Reception should follow a predictable pattern so everyone understands it. One common approach: serve 2 walk-ins, then 1 appointment (or 3:1 depending on your mix). The ratio can change by hour, but the rule must be consistent.',
      },
      {
        type: 'ul',
        items: [
          'If you are 70% walk-ins: start with 3 walk-ins : 1 appointment.',
          'If you are 50/50: start with 2 walk-ins : 1 appointment.',
          'If you are mostly appointments: serve appointments as primary, but keep walk-ins in a visible queue.',
        ],
      },
      { type: 'h2', text: 'How to choose slot length and buffers' },
      {
        type: 'p',
        text: 'Start with your median consult time (not the fastest). Then add a buffer. Example: if median consult is 7 minutes, set slots to 10 minutes with a 10–15 minute buffer each hour. This prevents “schedule drift” where the last patient waits an hour.',
      },
      {
        type: 'p',
        text: 'Median matters because it represents your “typical” patient. If you base slots on your fastest consults, your schedule will look amazing on paper and terrible in the waiting room. Paper doesn’t complain. Patients do.',
      },
      { type: 'h2', text: 'No-shows: stop treating them like bad luck' },
      {
        type: 'p',
        text: 'No-shows happen when patients forget, get busy, or feel uncertain. Your job is to reduce uncertainty and make rescheduling easy.',
      },
      {
        type: 'ul',
        items: [
          'Send a reminder (SMS/WhatsApp) with one-tap confirmation.',
          'If they can’t come, allow “reschedule” instead of forcing a call.',
          'Over time, tag channels that no-show more and adjust buffers.',
        ],
      },
      { type: 'h2', text: 'Handling urgent cases without breaking trust' },
      {
        type: 'p',
        text: 'Urgent cases should have a visible triage flag. The queue should show that the urgent patient is prioritized and why. Transparency prevents arguments at the counter and avoids the perception of favoritism.',
      },
      {
        type: 'quote',
        text: 'If you prioritize urgent cases secretly, people assume favoritism. If you prioritize them visibly, people assume competence.',
      },
      { type: 'h2', text: 'Edge cases that break clinics (and how to handle them)' },
      {
        type: 'ul',
        items: [
          'Late appointment arrival: treat them as a walk-in token or put them in the next available window—don’t jump them ahead of everyone.',
          'Early appointment arrival: keep them waiting until their window—otherwise everyone will start arriving 45 minutes early.',
          'Multi-patient families: give a clear policy (e.g., one token per patient) and explain it upfront.',
          'VIP patients: allow a visible “priority reason” so staff doesn’t have to argue on your behalf.',
        ],
      },
      { type: 'h2', text: 'The clinic-side payoff' },
      {
        type: 'ul',
        items: [
          'Fewer no-shows because patients understand arrival windows.',
          'More predictable doctor utilization across the day.',
          'Less reception stress because rules are consistent.',
          'Better reviews because waiting feels fair and explained.',
        ],
      },
      {
        type: 'p',
        text: 'Once the hybrid policy is stable, you can optimize further with reminders, easy rescheduling, and simple analytics (no-show rate by channel, waiting time by hour). Start simple. The best schedule is the one your team can follow when it’s busy—because that’s when it matters.',
      },
    ],
  },
  {
    slug: 'clinic-patient-flow-template-reception-to-billing',
    topic: 'PATIENT FLOW',
    title: 'Reception → consultation → lab → pharmacy: a clinic patient-flow template',
    excerpt:
      'Most clinics “work” until one department gets busy—then the whole system slows down. The fix is mapping patient flow like a pipeline: define steps, required data at each step, and who owns the handoff. This article gives a practical template for multi-department clinics and common bottleneck fixes.',
    author: 'Clinic OS Editorial Team',
    publishedAt: '2025-12-31',
    readingTimeMinutes: 17,
    content: [
      {
        type: 'p',
        text: 'Think of your clinic like an airport: the experience is smooth only when every station knows what happens next. In clinics, most delays happen at transitions—reception to doctor, doctor to lab, lab to billing, billing to pharmacy. A patient-flow template makes ownership explicit.',
      },
      {
        type: 'p',
        text: 'If your clinic sometimes feels like a relay race where the baton is… missing… that’s a patient-flow problem. The patient is the baton. If the baton disappears between departments, everyone runs around looking busy while nothing moves forward. (We’ve all seen this movie.)',
      },
      { type: 'h2', text: 'What “patient flow” actually means' },
      {
        type: 'p',
        text: 'Patient flow is not just the queue. It’s the full journey: what information is captured, where decisions happen, how handoffs happen, and how the clinic knows a visit is truly complete.',
      },
      { type: 'h2', text: 'The template (use this as your baseline)' },
      {
        type: 'ul',
        items: [
          'Check-in: verify patient identity + visit type + department/doctor.',
          'Waiting: patient is queued and can see progress.',
          'Consultation: doctor updates diagnosis + prescription + orders.',
          'Diagnostics: lab/imaging receives orders and updates status (in progress / ready).',
          'Billing: billable items flow from consultation + diagnostics with minimal manual entry.',
          'Pharmacy: prescription is fulfilled with clear payment status.',
          'Closure: visit is marked complete; follow-up is scheduled if needed.',
        ],
      },
      { type: 'h2', text: 'Assign ownership for each step (this is where flow becomes real)' },
      {
        type: 'p',
        text: 'Every step needs an owner. Not “the clinic.” A human. When ownership is unclear, work becomes optional and optional work becomes… tomorrow.',
      },
      {
        type: 'ul',
        items: [
          'Check-in owner: reception (ensures minimum fields are complete).',
          'Queue owner: reception (controls ordering + exceptions).',
          'Consultation owner: doctor (updates orders/prescription as part of closing the consult).',
          'Diagnostics owner: lab/imaging desk (updates progress + readiness).',
          'Billing owner: billing desk (finalizes bills, handles cancellations/refunds).',
          'Closure owner: reception/billing (marks visit complete + schedules follow-up).',
        ],
      },
      { type: 'h2', text: 'Your handoff rules (keep them boring and consistent)' },
      {
        type: 'p',
        text: 'A handoff is successful only when the receiving station sees it and acknowledges it. If a doctor “sends to lab” but the lab doesn’t see the order, the handoff didn’t happen—someone just had a hope.',
      },
      {
        type: 'ul',
        items: [
          'Doctor → lab: orders must appear in lab queue automatically.',
          'Lab → billing: report-ready status should be visible (even if billing happens later).',
          'Billing → pharmacy: payment status should be clear before dispensing (policy varies by clinic).',
        ],
      },
      { type: 'h2', text: 'Common bottlenecks and fixes' },
      {
        type: 'ul',
        items: [
          'Repeated registration: use one patient record, not multiple forms.',
          '“Lost” patients between departments: require a status update on handoff.',
          'Billing at the very end: generate draft bills as orders are created.',
          'Report turnaround confusion: show lab status in the same queue view.',
        ],
      },
      { type: 'h2', text: 'Make the patient journey visible (so patients stop asking)' },
      {
        type: 'p',
        text: 'Patients ask the counter because the counter is the only visible system. If you show “You are waiting for: Consultation” and later “You are waiting for: Report,” questions drop. It’s not magic—it’s visibility.',
      },
      { type: 'h2', text: 'A practical flow for multi-department clinics (example)' },
      {
        type: 'p',
        text: 'Example: patient checks in for ENT, gets consultation, then gets an audiometry test, then billing, then pharmacy. In a healthy flow, each station updates status and the next station sees the handoff immediately. No phone calls. No “where did they go?”',
      },
      {
        type: 'ul',
        items: [
          'Reception: Checked-in → Waiting (Token 18).',
          'Doctor: In consultation → Sent to Diagnostics (Audiometry).',
          'Diagnostics: In progress → Report ready.',
          'Billing: Billing pending → Paid.',
          'Pharmacy: Dispensed → Visit complete.',
        ],
      },
      { type: 'h2', text: 'How to improve flow without “more software”' },
      {
        type: 'p',
        text: 'Even before tooling, you can improve flow by standardizing steps and ownership. But software helps you keep the discipline when you’re busy (which is the only time discipline matters).',
      },
      {
        type: 'quote',
        text: 'Flow isn’t a “nice to have.” Flow is the difference between “busy and profitable” vs “busy and stressed.”',
      },
      {
        type: 'p',
        text: 'Once your flow is stable, you can instrument it: turnaround time per step, queue length by hour, and handoff latency between departments. That’s how you turn operations into a measurable system. Improve one bottleneck at a time and the entire clinic will feel faster—without anyone running faster.',
      },
    ],
  },
];

export function getBlogPostBySlug(slug: string) {
  return BLOG_POSTS.find((p) => p.slug === slug);
}


