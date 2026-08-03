# Candidate queue — opportunities found, not yet verified

Search pass of 2026-08-03. **Nothing here is in the catalog yet, and nothing
here should be added without opening its official page first.**

Why they are queued rather than merged: this pass was done from a session whose
network policy allows web *search* only — every direct fetch (`WebFetch`, and
`curl` through the egress proxy) is refused with 403, including `example.com`.
So each row below rests on a search index, not on the organiser's own page. Two
rules in [OPPORTUNITIES_PLAN.md](OPPORTUNITIES_PLAN.md#traps-worth-remembering)
say what that means:

> `npm run test:links` before every catalog change.
> A live link is not a live programme — read what the page actually says.

Neither could be run here. Everything below therefore needs one human pass with
a real browser before it becomes a row in `COMPETITIONS`.

---

## The structural gap this pass was aimed at

**The catalog has zero local opportunities.** `Competition.region` / `.city`
exist precisely so a Tashkent hackathon never lands on an Almaty student's list,
`buildExtracurriculars` filters on `homeCountry`, `regionLabel` renders the
badge, and the card shows a "Local · city" chip — the whole mechanism is built
and shipped, and 0 of 146 rows use it. Meanwhile `lib/data/geo.ts` maps ~40
Kazakh and Uzbek cities, so we know exactly who we are serving.

Every global row is also, in practice, an English-language row. A 13-year-old in
Shymkent gets a catalog whose 146 entries are all somewhere else.

Second gap, much smaller: `law` (12 rows) and `medicine_health` (20) are the
thinnest fields, against 72 for `computer_science`.

---

## Local — Kazakhstan

| Candidate | What the search index says | Must verify before merging |
|---|---|---|
| **РНПЦ «Дарын»** (`daryn.kz`) | The state body running the republican subject olympiads for school students, incl. a separate olympiad for rural schools across 13 subjects, under the Ministry of Education. Entry through school. | Whether a student can enter directly or only via school; the actual cycle dates; that participation is free; the right landing URL for a student (not the ministry's) |
| **KKO.KZ** (`kko.kz`) | Republican *online* olympiads and contests for schoolchildren, said to be free to enter, issues republican-level diplomas | Whether this is a state programme or a commercial diploma mill — a paid-certificate model here would be exactly the thing our cost field exists to expose. Check before it goes anywhere near a card |
| **Kazakhstan AI Olympiad** (national) | First edition ran in May for grades 9–12; 683 entrants → 40 national finalists at Astana IT University → 12 to the IOAI training camp | Official page and organiser, whether the next edition is announced, entry route, fee |
| **Decentrathon 5.0** (Astana Hub) | Country's largest hackathon, 27 Mar – 5 Apr 2026 across 20 cities, AI and blockchain tracks | **Age floor.** Most developer hackathons are 18+; if so this is not a school-student opportunity and does not belong in the catalog at all |
| **KazHackathon** (`kazhackathon.kz`) | Cybersecurity competition, Kazakhstan | Same: who may enter, school students or professionals; fee; cycle |

## Local — Uzbekistan

| Candidate | What the search index says | Must verify before merging |
|---|---|---|
| **National AI Hackathon (UZ)** | Regional stages feeding a grand final in Tashkent, December 2026; tracks in healthcare, cybersecurity, education, entrepreneurship. Regional applications were said to close 8 Aug 2026 | Whether school students may enter; the organiser's own page; whether the 2026 cycle is already closed by the time this is read |
| **IOI 2026 host events** | Uzbekistan hosts the 38th International Olympiad in Informatics, 9–16 Aug 2026, Tashkent — organised with the Ministry of Digital Technologies and the Science Olympiads Center | IOI itself is already row `ioi`. What to look for is the **national selection route** for Uzbek students, which is what a local row would actually be |
| `hackathons.uz`, `dev.events` | Aggregators of Uzbek tech events | Not entries themselves — use as a source to find dated, school-eligible events |

## Global — fills a thin field

| Candidate | What the search index says | Must verify before merging |
|---|---|---|
| **IOAI — International Olympiad in Artificial Intelligence** (`ioai-official.org`) | 3rd edition, Astana, Kazakhstan, 2–8 Aug 2026. National teams, same shape as IMO/IOI | Confirm it is national-team entry (→ `viaNationalSelection: true`, `cost: "free"` with the same wording as the other international olympiads), and the selection route for KZ/UZ students. **Highest-value single addition here**: we carry twelve international olympiads and no AI one, in the field our catalog is heaviest in |
| **PROD** (software-engineering olympiad) | International, open to grades 8–12 from any country, English-language track | Organiser, official URL, fee, cycle dates. Reported via Tashkent Times, not seen first-hand |
| **International Moot Court** (`jrcnyc.org`) | High-school international moot court on the International Criminal Court, run with the City of The Hague since 2012 | Whether international (non-NYC) students may enter — the programme reads as NYC public schools first. If it is NYC-only it is not for our students. Fee, travel cost |
| **IMHO — International Medicine & Health Olympiad** (`imholympiad.org`) | Grades 9–12, age ≤21, no citizenship requirement, online proctored, 22 Aug 2026 | **The fee.** Private online "olympiads" in this space commonly charge registration; that has to be read off the page, not assumed |
| **IMDO — International Medicine and Disease Olympiad** (`imdolympiad.org`) | Annual online medical knowledge competition for high-school students worldwide, with USMDO as the US qualifier | Same: fee, whether non-US students enter directly or through a national qualifier |

---

## When merging, the row still needs

`dateConfirmed: true` **only** if the date came off the organiser's own page for
the current cycle; otherwise leave it false and let the card say "dates not yet
announced". `cost` / `costDetail` per the model in `key-dates.ts` — and
`unknown` is the correct answer for anything unread, never `free`. `eligibility`
phrased as the organiser phrases it, with an explicit `gate` if the sentence
contains two brackets. `region: "KZ"` / `"UZ"` and `city` for every local row —
that is the point of this pass.

Then `npm run test:links`, and read each page before trusting the 200.
