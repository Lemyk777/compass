# Documentation

## Start here, in this order

| Document | What it is |
| --- | --- |
| [BACKLOG_2026-08.md](BACKLOG_2026-08.md) | **§1 first.** What is deployed versus what is only on a branch, the ordered next list (§8), the findings worth not re-discovering (§5) and the working method (§7). Getting §1 wrong is the fastest way to do work twice |
| [AUDIT_2026-08-14.md](AUDIT_2026-08-14.md) | Nine findings with evidence, each saying what it costs a student. **A1 and A3 are closed; seven are open**, and they are cheaper than anything left on the backlog |
| [../CLAUDE.md](../CLAUDE.md) | The product rules, in the form Claude Code reads. Every rule in it is a bug this codebase shipped |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Map of the codebase — which file to open for a given change |
| [WORKFLOW.md](WORKFLOW.md) | **How the work is cut up and what each piece must prove.** The six kinds of work, the four agents in [`.claude/agents/`](../.claude/agents), what is never delegated, and why two agents can silently break each other |
| [SETUP.md](SETUP.md) | Getting a working instance: Supabase project, environment, roles |

## The three student sections — plans of record

| | |
| --- | --- |
| [OPPORTUNITIES_PLAN.md](OPPORTUNITIES_PLAN.md) | **The front door.** Status, the current goal, ordered next steps, traps worth remembering |
| [OPPORTUNITIES_RESEARCH.md](OPPORTUNITIES_RESEARCH.md) | **Read before designing any of it.** Why it is built as an eligibility verdict rather than a catalog, from randomized trials and meta-analyses |
| [PLANNER_PLAN.md](PLANNER_PLAN.md) | **The plan.** One route, three lenses, the guide→plan join, and why moving is a button and never a drag |
| [superpowers/specs/2026-08-15-guided-thread-design.md](superpowers/specs/2026-08-15-guided-thread-design.md) | **The companion.** The diagnosis it answers: we built an excellent library and called it accompaniment |
| [OPPORTUNITIES_CANDIDATES.md](OPPORTUNITIES_CANDIDATES.md) | Catalog entries considered and the verdict on each |

## What changed, and when

| | |
| --- | --- |
| [../CHANGELOG.md](../CHANGELOG.md) | What went to production, in plain English — what a student notices, what changed underneath, and anything needing a manual step |
| [../CONTRIBUTING.md](../CONTRIBUTING.md) | How a change gets in: branches, commits, the verification gate, the migration policy |

## Product spec and origin

| | |
| --- | --- |
| [compass-project-blueprint.md](compass-project-blueprint.md) | The full product spec |
| [PROJECT.md](PROJECT.md) | Project overview and history |
| [ORIGINAL_REQUEST.md](ORIGINAL_REQUEST.md) | The brief this was built from |

## Older research and calibration

These predate the current shape of the product. They are kept for the reasoning,
not as a description of what exists — check anything structural in them against
[ARCHITECTURE.md](ARCHITECTURE.md) before acting on it.

| | |
| --- | --- |
| [dataset_pipeline_ideas.md](dataset_pipeline_ideas.md) | Building a real admissions dataset for calibration |
| [project_emotional_ux_strategy.md](project_emotional_ux_strategy.md) | Tone and emotional design. **Written June 2026**, before the product's centre moved off the report — several components it names no longer exist |
| [TEST_INFRA.md](TEST_INFRA.md), [TEST_READY.md](TEST_READY.md) | Test infrastructure notes from June 2026. The current verification path is in [../CONTRIBUTING.md](../CONTRIBUTING.md) |

## Folder READMEs

`lib/data/`, `lib/ai/`, `scripts/` and `supabase/migrations/` each carry their
own README covering the rules that apply inside them. Read the one for the
folder you are about to change.
