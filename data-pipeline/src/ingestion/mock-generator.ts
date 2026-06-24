import * as fs from 'fs';
import * as path from 'path';

export interface ScrapedPost {
  source_platform: 'reddit' | 'twitter';
  source_id: string;
  url: string;
  author: string;
  raw_text: string;
  scraped_at: string;
}

const COUNTRIES = [
  'India', 'Italy', 'Hong Kong', 'USA', 'Canada', 'United Kingdom', 
  'Germany', 'Vietnam', 'South Korea', 'Singapore', 'Turkey', 'Brazil',
  'Pakistan', 'Nigeria', 'France', 'Spain'
];

const MAJORS = [
  'Computer Science', 'Mechanical Engineering', 'Bioengineering', 
  'Economics & Finance', 'Business Administration', 'Physics', 
  'International Relations', 'Mathematics', 'Chemistry', 'Data Science'
];

const CURRICULUMS = ['IB', 'A-Level', 'national', 'US-GPA', 'other'];

const US_UNIVERSITIES = [
  'Stanford University', 'MIT', 'Harvard University', 'Yale University', 
  'Columbia University', 'NYU', 'University of Pennsylvania', 'UC Berkeley',
  'UCLA', 'Cornell University', 'Caltech', 'Princeton University'
];

const IT_UNIVERSITIES = [
  'Bocconi University', 'Politecnico di Milano', 'Sapienza University of Rome',
  'University of Bologna', 'University of Padua', 'University of Milan'
];

const HK_UNIVERSITIES = [
  'University of Hong Kong (HKU)', 'Hong Kong University of Science and Technology (HKUST)',
  'Chinese University of Hong Kong (CUHK)', 'Hong Kong Polytechnic University (PolyU)',
  'City University of Hong Kong (CityU)'
];

const EXTRACURRICULARS = [
  { position: 'Founder', org: 'High School Coding Club', desc: 'Led 40+ members in weekly algorithm workshops and developed school app.' },
  { position: 'Research Assistant', org: 'Local University Lab', desc: 'Analyzed machine learning datasets under professor supervision.' },
  { position: 'President', org: 'Student Council', desc: 'Represented 500+ students and organized fundraising drives.' },
  { position: 'Captain', org: 'Varsity Soccer Team', desc: 'Led team to regional finals. Managed practices and coordinated travel.' },
  { position: 'Volunteer', org: 'Red Cross Chapter', desc: 'Dedicated 120+ hours to community blood drives and disaster relief planning.' },
  { position: 'Intern', org: 'FinTech Startup', desc: 'Assisted development team with front-end React code and QA testing.' },
  { position: 'Lead Cellist', org: 'Youth Symphony Orchestra', desc: 'Performed in bi-annual charity concerts. Practice 10 hrs/week.' },
  { position: 'Founder', org: 'Non-profit Tutoring Service', desc: 'Provided free online math classes to 80+ underprivileged elementary students.' },
  { position: 'Model UN Delegate', org: 'Debate Society', desc: 'Won best delegate award at state-level conference. Researched global trade policies.' },
  { position: 'Independent Developer', org: 'Self-employed', desc: 'Published two productivity utilities on Google Play Store with 5000+ total downloads.' }
];

const HONORS = [
  { title: 'National Merit Scholar Semifinalist', levels: ['National'] },
  { title: 'Valedictorian', levels: ['School'] },
  { title: 'Olympiad in Informatics - Silver Medalist', levels: ['National', 'State/Regional'] },
  { title: 'AP Scholar with Distinction', levels: ['National'] },
  { title: 'First Place, Regional Science Fair', levels: ['State/Regional'] },
  { title: 'Outstanding Youth Leadership Award', levels: ['International'] },
  { title: 'Presidential Volunteer Service Award - Gold', levels: ['National'] },
  { title: 'International Mathematics Competition Certificate', levels: ['International'] }
];

function getRandomElements<T>(arr: T[], num: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, num);
}

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateMockRedditPost(index: number): ScrapedPost {
  const country = getRandomElement(COUNTRIES);
  const citizenship = Math.random() > 0.3 ? country : getRandomElement(COUNTRIES);
  const major = getRandomElement(MAJORS);
  const curriculum = getRandomElement(CURRICULUMS);
  
  // GPA and Grades
  let gradesRaw = '';
  let ibTotal: number | undefined;
  let gpa: number | undefined;
  let nationalPercent: number | undefined;

  if (curriculum === 'IB') {
    ibTotal = Math.floor(Math.random() * (45 - 34 + 1)) + 34; // 34 to 45
    gradesRaw = `IB Predicted: ${ibTotal}/45 (776 at HL)`;
  } else if (curriculum === 'US-GPA') {
    gpa = parseFloat((Math.random() * (4.0 - 3.5) + 3.5).toFixed(2)); // 3.50 to 4.00
    gradesRaw = `GPA: ${gpa} UW / 4.45 W`;
  } else if (curriculum === 'national') {
    nationalPercent = parseFloat((Math.random() * (100 - 88) + 88).toFixed(1)); // 88% to 100%
    gradesRaw = `National Curriculum Score: ${nationalPercent}% average`;
  } else {
    gradesRaw = `Grades: straight As, top 5% of class`;
  }

  // Tests
  const sat = Math.random() > 0.15 ? Math.floor((Math.random() * (1600 - 1300) + 1300) / 10) * 10 : undefined;
  const act = sat ? undefined : Math.floor(Math.random() * (36 - 28 + 1)) + 28;
  const ielts = country !== 'USA' && country !== 'Canada' && country !== 'United Kingdom' 
    ? Math.floor(Math.random() * (9.0 - 6.5 + 0.5) / 0.5) * 0.5 + 6.5 
    : undefined;
  const toefl = ielts === undefined && country !== 'USA' && country !== 'Canada'
    ? Math.floor(Math.random() * (120 - 95 + 1)) + 95
    : undefined;

  // Extracurriculars
  const numEc = Math.floor(Math.random() * 4) + 3; // 3 to 6
  const ecs = getRandomElements(EXTRACURRICULARS, numEc);
  const ecLines = ecs.map((ec, idx) => 
    `${idx + 1}. **${ec.position}** at *${ec.org}*: ${ec.desc} (Grades 10-12, ${Math.floor(Math.random() * 8) + 4} hrs/week)`
  ).join('\n');

  // Honors
  const numHonors = Math.floor(Math.random() * 3) + 1; // 1 to 3
  const honors = getRandomElements(HONORS, numHonors);
  const honorLines = honors.map((h, idx) => 
    `${idx + 1}. **${h.title}** - Level: ${h.levels.join(', ')} (Grade ${Math.floor(Math.random() * 4) + 9})`
  ).join('\n');

  // Admissions outcomes for US, IT, HK
  const acceptedUS = getRandomElements(US_UNIVERSITIES, Math.floor(Math.random() * 2) + 1);
  const rejectedUS = getRandomElements(US_UNIVERSITIES.filter(u => !acceptedUS.includes(u)), Math.floor(Math.random() * 2) + 1);
  
  const acceptedIT = getRandomElements(IT_UNIVERSITIES, Math.floor(Math.random() * 2));
  const rejectedIT = getRandomElements(IT_UNIVERSITIES.filter(u => !acceptedIT.includes(u)), Math.floor(Math.random() * 2));

  const acceptedHK = getRandomElements(HK_UNIVERSITIES, Math.floor(Math.random() * 2));
  const rejectedHK = getRandomElements(HK_UNIVERSITIES.filter(u => !acceptedHK.includes(u)), Math.floor(Math.random() * 2));

  const needAid = Math.random() > 0.5;

  const postId = `t3_2026${index.toString().padStart(4, '0')}`;
  const subreddit = Math.random() > 0.5 ? 'ApplyingToCollege' : 'IntltoUSA';
  const url = `https://www.reddit.com/r/${subreddit}/comments/${postId}/decision_chance_me_2025_2026_results/`;

  const raw_text = `
[Decision/Results] 2025-2026 Profile Cycle Post
Hey guys, sharing my stats and final decisions for this year. Hope this helps future applicants!

**Demographics**
- Country: ${country}
- Citizenship: ${citizenship}
- Income/Needs Aid: ${needAid ? 'Yes, need full financial aid' : 'No, full pay'}

**Academic Stats**
- Curriculum: ${curriculum}
- ${gradesRaw}
- Standardized Tests:
  ${sat ? `* SAT: ${sat}` : ''}
  ${act ? `* ACT: ${act}` : ''}
  ${ielts ? `* IELTS: ${ielts}` : ''}
  ${toefl ? `* TOEFL: ${toefl}` : ''}
- Intended Major: ${major}

**Extracurriculars**
${ecLines}

**Honors**
${honorLines}

**Decisions / Outcomes**
- **Accepted**:
  ${acceptedUS.map(u => `* ${u} (US)`).join('\n  ')}
  ${acceptedIT.map(u => `* ${u} (Italy)`).join('\n  ')}
  ${acceptedHK.map(u => `* ${u} (Hong Kong)`).join('\n  ')}

- **Rejected/Waitlisted**:
  ${rejectedUS.map(u => `* ${u} (US)`).join('\n  ')}
  ${rejectedIT.map(u => `* ${u} (Italy)`).join('\n  ')}
  ${rejectedHK.map(u => `* ${u} (Hong Kong)`).join('\n  ')}

Thank you to everyone who helped me through this application season!
  `.trim();

  return {
    source_platform: 'reddit',
    source_id: postId,
    url,
    author: `u/college_hopeful_2026_${index}`,
    raw_text,
    scraped_at: new Date(Date.now() - index * 3600000).toISOString()
  };
}

export function generateMockTwitterPost(index: number): ScrapedPost {
  const country = getRandomElement(COUNTRIES);
  const major = getRandomElement(MAJORS);
  const curriculum = getRandomElement(CURRICULUMS);
  
  let gpaStr = '';
  if (curriculum === 'IB') {
    gpaStr = `IB: ${Math.floor(Math.random() * (45 - 34 + 1)) + 34}/45`;
  } else if (curriculum === 'US-GPA') {
    gpaStr = `GPA: ${(Math.random() * (4.0 - 3.6) + 3.6).toFixed(2)} UW`;
  } else {
    gpaStr = `Grades: ${Math.floor(Math.random() * (100 - 90) + 90)}%`;
  }

  const satStr = Math.random() > 0.2 ? `SAT: ${Math.floor((Math.random() * (1600 - 1350) + 1350) / 10) * 10}` : '';

  // Select some universities
  const acceptedUS = getRandomElement(US_UNIVERSITIES);
  const acceptedIT = getRandomElement(IT_UNIVERSITIES);
  const acceptedHK = getRandomElement(HK_UNIVERSITIES);

  const postId = `18062326${index.toString().padStart(4, '0')}`;
  const author = `student_traveler_${index}`;

  const tweets = [
    `Stats check! 🎓 Class of 2026 stats: ${gpaStr} ${satStr ? `| ${satStr}` : ''}. Intended Major: ${major}. From ${country}. Got accepted to ${acceptedUS} 🇺🇸, ${acceptedIT} 🇮🇹, and ${acceptedHK} 🇭🇰! So incredibly blessed! Thread coming soon. 🧵👇`,
    `Super excited to announce I will be attending ${acceptedUS}! 🌲 Demographics: international applicant from ${country}. Grades: ${gpaStr}. Tests: ${satStr || 'Test optional'}. Also got offers from ${acceptedIT} in Milan/Rome and ${acceptedHK}! Hard work paid off.`,
    `A2C / Twitter community: here are my results for the 2025/2026 cycle. 
Major: ${major} (residing in ${country})
Academics: ${gpaStr}, ${satStr || 'ACT 34'}
Outcomes:
✅ Admitted: ${acceptedUS}, ${acceptedIT}, ${acceptedHK}
❌ Rejected: Stanford, MIT, Harvard.
Final destination soon!`,
    `From ${country} ➡️ US / Italy / HK. ✈️
Academics: ${gpaStr} ${satStr ? `| ${satStr}` : ''}
EC: Founded coding club, research at lab, captain of soccer.
Decisions:
Accepts: ${acceptedUS} (full financial aid!), ${acceptedIT}, ${acceptedHK}
Rejects: NYU, Columbia, HKUST.
Class of 2030 / 2026 application cycle is done! 🎉`
  ];

  const raw_text = getRandomElement(tweets);

  return {
    source_platform: 'twitter',
    source_id: postId,
    url: `https://x.com/${author}/status/${postId}`,
    author: `@${author}`,
    raw_text,
    scraped_at: new Date(Date.now() - index * 3600000).toISOString()
  };
}

export function writeMockDataset(rawDir: string, count: number = 100): void {
  if (!fs.existsSync(rawDir)) {
    fs.mkdirSync(rawDir, { recursive: true });
  }

  console.log(`Generating ${count} mock Reddit posts and ${count} mock Twitter posts...`);

  // Write Reddit posts
  for (let i = 1; i <= count; i++) {
    const post = generateMockRedditPost(i);
    const filepath = path.join(rawDir, `reddit_post_${post.source_id}.json`);
    fs.writeFileSync(filepath, JSON.stringify(post, null, 2), 'utf-8');
  }

  // Write Twitter posts
  for (let i = 1; i <= count; i++) {
    const post = generateMockTwitterPost(i);
    const filepath = path.join(rawDir, `twitter_post_${post.source_id}.json`);
    fs.writeFileSync(filepath, JSON.stringify(post, null, 2), 'utf-8');
  }

  console.log(`Successfully generated and wrote ${count * 2} mock files to ${rawDir}.`);
}
