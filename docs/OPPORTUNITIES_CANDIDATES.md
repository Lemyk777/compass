# Candidate queue — opportunities found, not yet verified

> **Read the 2026-08-25 section at the bottom first.** The queue below is the
> search pass of 2026-08-03, which could not fetch a single page. It has since
> been answered: 20 Kazakh rows are in the catalog, audit A8 is closed, and the
> gap this file opens by describing — "the catalog has zero local
> opportunities" — no longer exists. What is still worth reading here is the
> reasoning, and what is worth reading at the bottom is the list of candidates
> that were checked and REJECTED, with the reason for each.

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

---

# The 2026-08-25 pass — verified, and the ones that failed

**This closes the queue above.** That pass could not fetch a single page and
said so; this one fetched every one. **Twenty rows shipped** with
`region: "KZ"`, catalog 172 → 192, and audit finding A8 closed.

The value of what follows is not the twenty — those are in
`lib/data/competitions-data.ts` under `── Kazakhstan (local) ──`, with their
evidence in the comments. It is the **rejections**. Each one below cost a
verification pass, and without this list the next person searching "Kazakhstan
school competition" walks the same ground and reaches the same dead ends.

## Rejected because a student cannot enter

| | why |
| --- | --- |
| Alem School | age floor 18: "Школа рассчитана на всех желающих в возрасте от 18 до 35 лет" |
| Tomorrow School | age floor 18, stated by the organiser: "Подать заявку может любой человек старше 18 лет" |
| Tech Orda | 18–45, and the round now open selects IT *schools*, not students |
| Kolesa Academy | a paid internship for junior developers, leading to a job offer |
| Decentrathon | 18+; school students only inside a team led by an adult captain |

## Rejected because no organiser sentence says who may enter

Under the rule "never invent an eligibility sentence", these are drops rather
than judgement calls. Each is otherwise a good row, and each needs **one
sentence** from the organiser to become shippable.

| | what is missing |
| --- | --- |
| **QazVolunteer.kz** | the national volunteering platform: government-backed, live, free, national, exactly the shape this gap wanted. No age or eligibility rule on `/ru`, `/ru/about` or `/ru/directions`; `/ru/faq` and `/ru/registration` are 404. The Kazakh volunteering age floor is a fact about the *law*, not a sentence on the page, and quoting the law as though it were the organiser is the remembered-not-verified failure. **One message to the platform closes this.** |
| **Astana Hub events** | 44 dated events, free bootcamps and children's IT camps running in Semey, Aktau, Zhezkazgan, Karaganda, Kokshetau and Uralsk — the regional reach this whole item is about. But a *calendar* has no eligibility, and a card's `eligibility` renders on every impression. The shape that works is the admin quick-add posting ONE dated event with its own stated age rule. |
| **WRO Kazakhstan** | the national organiser page (`robotics.nis.edu.kz`) states no age band in HTML; every band lives in a PDF. It also overlaps the shipped `wro` row. What it DID give us: the 2026 season in full, which is how the `wro` row's wrong "world final in November" was caught. |
| **FIRST Kazakhstan** | the age bands ARE stated, so the evidence rule is satisfied — but there is no registration route on the page at all, only Instagram, an email and a phone number, and the page still advertises the 2025–2026 season. `ustemrobotics.kz` fails TLS with a certificate-name mismatch and must not be shipped. |
| **Republican Olympiad in Finance and Economics** (daryn.kz) | the page carries no prose, only collapsed accordions. Its own heading says grades 9–11 (12) and the site's rules index says 9–10 (11) for the same contest. The Положение that would settle it is a scan with no text layer. |
| **nFactorial incubator** | the best-known name in this domain, and precisely why it must not ship on reputation: no age sentence and no fee sentence anywhere in the HTML, and the page shows "Старт программы: 2 июня 2025 г." Worth a second look by someone who can read the JS-rendered FAQ. |

## Rejected because the far end could not be reached

**A DNS failure or a reset from one connection proves nothing** — three links the
weekly gate once called dead answer 200 from an ordinary browser. These need
reproducing from a residential connection in Kazakhstan before anyone concludes
they are gone, and two of them would be worth real effort:

- **`ziyatker.org`** — the state contest centre that runs most non-olympiad
  republican competitions (debate, essay, art). No A record at all. If it is
  alive, it is the single richest remaining source for this gap.
- **`reading-nation.kz`** — the national reading contest, grades 6–10, debates
  plus essay plus testing. SERVFAIL from lame delegation on all three
  nameservers.
- `presidentlibrary.kz` (Astana school debate), `qazcoders.kz`, `itfest.kz`,
  `decentrathon.ai` — reset or DNS failure.
- `kz.usembassy.gov` — the English Access Microscholarship programme, for
  13–15-year-olds from disadvantaged families, which would be an unusually good
  fit. Refused by the verifying session's own egress proxy, which is a fact
  about that session and not about the far end.
- **NXDOMAIN, i.e. genuinely gone:** `halmun.com`, `zhasproject.kz`,
  `jasylel.kz`, `almatymun.kz`, `kazmun.kz`, `astanamun.kz`, `shabyt.kz`,
  `bilimfoundation.kz`. Kazakhstan's Model UN scene has a lot of dead domains;
  `mismun.miras.kz` is the one that answered, and it shipped.

## Three rules this pass added, all of them learned the expensive way

1. **The Kazakh alphabet cannot appear in a catalog field.** `OG_GLYPHS` covers
   Cyrillic А-я and Ёё, which is Russian; ә, қ, ғ, ң, ө, ұ, ү, һ, і and ₸ are
   all outside it and render as blank boxes on a share card. Use the Russian
   names the organisers publish alongside. See problem 7 in the backlog.
2. **"9-11 (12)" is written as "Grades 9–12".** Kazakhstan runs an 11-year and a
   12-year school programme, and `parseEligibility` takes the FIRST range off a
   dash — so anything cleverer caps out a genuinely eligible 12th-grader.
3. **Write a second number in words.** `mismun-almaty` says "a school delegation
   of five to seven" rather than "5–7", because that dash beside "Grades 9–12"
   is one edit away from becoming the grade rule.

## What the link gate cannot see — three cases found on 2026-08-25

`classifyStatus` sorts an answer into five bands and two of them fail the run.
That rule is right and is unit-tested. What the pass below found is three
situations where the BAND IS CORRECT AND THE CONCLUSION IS WRONG, because the
band is read off a status code and the status code is not what is happening.
None of them is a reason to change the bands. All three are a reason to read the
body before acting on a verdict.

**1. `unreachable` that no retry will ever clear — an incomplete TLS chain.**
Three Kazakhstani university hosts — `kbtu.edu.kz`, `farabi.university` and
`satbayev.university`, all on the same issuer — serve only their leaf
certificate and no intermediate. A browser and `curl` recover by chasing the
AIA extension and get HTTP 200; **Node's `fetch` does not chase AIA**, so it
throws `UNABLE_TO_VERIFY_LEAF_SIGNATURE` and the checker lands in `catch` →
`unreachable`.

The standing rule for `unreachable` is "the far end is telling us about itself,
it proves nothing, go and reproduce from an ordinary connection". Here that rule
sends you on an errand whose answer is already known: **the page loads, and it
will still be `unreachable` next week and next year**, because this is a
permanent property of the host rather than a bad minute. A row on one of those
domains would sit red in the gate for as long as the misconfiguration lasts.
Worth knowing before anyone spends an afternoon on it, and worth weighing if a
KBTU or KazNU row is ever wanted badly enough.

**2. `blocked` (403) that means the site is switched off.** `kaznai.kz`, the
Kazakh National Academy of Arts, answers 403 to everything. 403 is in
`BOT_WALL`, so the run prints it as "the server answered and refused *this
caller* as a script — the page is there" and passes. The page is not there: the
body reads *"Аккаунт заблокирован администратором сервера / Account disabled by
server administrator"*, and it says the same to curl and to a browser.

This is the 401 lesson arriving from a third direction. "You are a robot", "this
needs credentials you do not have" and "this hosting account is suspended" are
three different sentences and two of them currently share a band. **A 403 body
is worth reading before the verdict is believed** — the interesting ones say
what they are.

**3. `ok` (200) that is a soft 404.** `narxoz.edu.kz` is a client-rendered
single-page app whose server returns **200 for every path**. The HTML is a
2.2 kB shell with an empty `<div id="root">`; what a human sees at
`/economics-olympiad` is *"Страница потерялась… Страница пошла на лекцию и
забыла вернуться"*. Confirmed identical on `/olympiads` and `/grant`.

`test:links` would report that URL healthy forever. **On a host like this the
HTTP status carries no information at all**, and the only verification is a
JS-rendering fetch or a human. This is the same shape as the rule already in
`lib/data/README.md` — *a discontinued contest can still answer HTTP 200* —
except that here it is the whole host rather than one stale page.

**The through-line, and it is the same one this repository keeps relearning:**
a green gate says the check ran, not that the thing is true. Each of these
three is a verdict that is correct about the code path and wrong about the
world.
