export type TestimonialRole =
  | 'Clinic Owner'
  | 'Hospital Manager'
  | 'Receptionist'
  | 'Billing Executive'
  | 'Lab Technician'
  | 'X-ray Technician'
  | 'Nursing Supervisor'
  | 'Pharmacist'
  | 'Operations Lead';

export type Testimonial = {
  id: number;
  name: string;
  role: TestimonialRole;
  organization: string;
  city: string;
  rating: 4 | 5;
  text: string;
  dateLabel: string;
};

const indianCities = [
  'Bengaluru',
  'Mumbai',
  'Delhi',
  'Pune',
  'Hyderabad',
  'Chennai',
  'Kolkata',
  'Ahmedabad',
  'Jaipur',
  'Lucknow',
  'Indore',
  'Kochi',
  'Surat',
  'Nagpur',
  'Coimbatore',
  'Chandigarh',
  'Bhopal',
  'Patna',
  'Guwahati',
  'Visakhapatnam',
];

const orgPrefixes = [
  'Shree',
  'Sree',
  'Sri',
  'New',
  'City',
  'Care',
  'Life',
  'Apollo',
  'Fortune',
  'Med',
  'Prime',
  'Aarogya',
  'Swasthya',
  'Harmony',
  'Wellness',
];

const orgTypes = [
  'Clinic',
  'Polyclinic',
  'Hospital',
  'Diagnostic Centre',
  'Multispeciality Clinic',
  'Nursing Home',
  'Medical Centre',
];

const firstNames = [
  'Aarav',
  'Vivaan',
  'Aditya',
  'Arjun',
  'Rohan',
  'Karan',
  'Rahul',
  'Siddharth',
  'Mohit',
  'Amit',
  'Priya',
  'Ananya',
  'Isha',
  'Nisha',
  'Kavya',
  'Pooja',
  'Sneha',
  'Aditi',
  'Neha',
  'Meera',
];

const lastNames = [
  'Sharma',
  'Verma',
  'Gupta',
  'Patel',
  'Reddy',
  'Iyer',
  'Nair',
  'Singh',
  'Khan',
  'Chowdhury',
  'Das',
  'Mehta',
  'Jain',
  'Joshi',
  'Bose',
  'Roy',
  'Kulkarni',
  'Shetty',
  'Bhat',
  'Chawla',
];

const roles: TestimonialRole[] = [
  'Clinic Owner',
  'Hospital Manager',
  'Receptionist',
  'Billing Executive',
  'Lab Technician',
  'X-ray Technician',
  'Nursing Supervisor',
  'Pharmacist',
  'Operations Lead',
];

const dateLabels = [
  'Today',
  'Yesterday',
  '2 days ago',
  'This week',
  '1 week ago',
  '2 weeks ago',
  '3 weeks ago',
  '1 month ago',
  '2 months ago',
  '3 months ago',
  '4 months ago',
  '6 months ago',
];

function pick<T>(arr: T[], n: number) {
  return arr[n % arr.length];
}

function makeName(i: number) {
  const first = pick(firstNames, i * 7 + 3);
  const last = pick(lastNames, i * 11 + 5);
  return `${first} ${last}`;
}

function makeOrg(i: number) {
  const prefix = pick(orgPrefixes, i * 5 + 1);
  const type = pick(orgTypes, i * 3 + 2);
  const area = pick(
    ['Health', 'Care', 'Speciality', 'Plus', 'Centre', 'Diagnostics', 'Medicare', 'Family'],
    i * 13 + 9,
  );
  return `${prefix} ${area} ${type}`;
}

function makeCity(i: number) {
  return pick(indianCities, i * 9 + 4);
}

function makeRating(i: number): 4 | 5 {
  // ~12% 4-star, rest 5-star
  return i % 8 === 0 ? 4 : 5;
}

function makeText(role: TestimonialRole, i: number) {
  const city = makeCity(i);
  const common = [
    'Setup was quick and the team started using it the same day.',
    'The interface is simple, so training new staff is easy.',
    'Queue updates are instant and patients are calmer in the waiting area.',
    'Daily token flow is smoother, especially during peak OPD hours.',
    'Support is responsive and fixes are fast.',
    'Reports are clean and help us review wait time trends.',
  ];

  const byRole: Record<TestimonialRole, string[]> = {
    'Clinic Owner': [
      'We reduced crowding at reception and improved the patient experience.',
      'For a small clinic, this feels like a proper system without complexity.',
      'Appointments + walk-ins are finally in one place.',
    ],
    'Hospital Manager': [
      'We can track flow across departments and avoid bottlenecks.',
      'It helped us standardize reception and doctor handoff processes.',
      'The dashboard gives a clear view of the day in one glance.',
    ],
    Receptionist: [
      'Token calling is straightforward and there’s less confusion at the counter.',
      'We spend less time answering “when is my turn?” questions.',
      'Patient check-in is faster and we make fewer manual mistakes.',
    ],
    'Billing Executive': [
      'Billing coordination is smoother because visit status is always visible.',
      'Fewer disputes because timestamps and status are clear.',
      'Less rework at end-of-day due to clean tracking.',
    ],
    'Lab Technician': [
      'We know when to expect samples and can plan batches better.',
      'Handovers between OPD and lab feel more coordinated.',
      'It reduced random walk-ins to the lab counter.',
    ],
    'X-ray Technician': [
      'Patient calling for imaging is orderly and predictable.',
      'Less chaos during rush hours; we process scans faster.',
      'We can coordinate with reception without constant phone calls.',
    ],
    'Nursing Supervisor': [
      'Overall patient movement is more organized and less stressful for the team.',
      'Handoffs are clearer and we avoid repeated instructions.',
      'Shift changes are easier because the queue state is visible.',
    ],
    Pharmacist: [
      'We get fewer last-minute rushes because patient flow is steadier.',
      'Better coordination with doctors and reception for prescriptions.',
      'It’s easier to manage peak-time queues at the counter.',
    ],
    'Operations Lead': [
      'Standardized flow + analytics helped us cut average wait time.',
      'We finally have consistent data to improve operations.',
      'Multi-clinic visibility is a big plus for our team.',
    ],
  };

  const roleLine = pick(byRole[role], i * 17 + 1);
  const commonLine1 = pick(common, i * 19 + 2);
  const commonLine2 = pick(common, i * 23 + 7);

  const spice = pick(
    [
      `Works well for our ${city} OPD.`,
      `Patients in ${city} have noticed the difference.`,
      `Our team in ${city} adapted quickly.`,
      'No more whiteboard juggling at reception.',
      'We stopped maintaining parallel Excel sheets.',
      'Doctor screen + reception view is a great combo.',
    ],
    i * 29 + 4,
  );

  // Keep it humane: 2–3 short sentences.
  return `${roleLine} ${commonLine1} ${spice} ${commonLine2}`;
}

export function generateTestimonials(count = 231): Testimonial[] {
  const out: Testimonial[] = [];
  for (let i = 0; i < count; i++) {
    const role = pick(roles, i * 3 + 1);
    out.push({
      id: i + 1,
      name: makeName(i),
      role,
      organization: makeOrg(i),
      city: makeCity(i),
      rating: makeRating(i),
      text: makeText(role, i),
      dateLabel: pick(dateLabels, i * 5 + 2),
    });
  }
  return out;
}



