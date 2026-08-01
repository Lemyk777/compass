# Original User Request

## Initial Request — 2026-06-23T12:00:52+05:00

# Teamwork Project Prompt — Draft

> Status: Launched

Устранить визуальную асимметрию и "кривизну" верстки в Hero-секции на Главной странице (Landing Page). Карточка "Your standing" слева и переключатель стран (Hong Kong и др.) справа расположены несимметрично, имеют разный визуальный вес и ломают композицию.

Working directory: `c:\Users\alibe\Desktop\compass-main`
Integrity mode: benchmark

## Requirements

### R1. Исправление сетки и размеров (Hero Section)
Команда должна проанализировать `app/(marketing)/page.tsx` и дочерние компоненты (вероятно, `MiniScorecard` и компонент выбора стран/карты). Необходимо найти и исправить Tailwind-классы, из-за которых правый элемент "висит в воздухе" и не совпадает по размеру с левой карточкой.

### R2. Восстановление симметрии и баланса
Сделать правильные размеры и расположение. Если правый элемент (Country Selector) изначально маленький, его нужно либо обернуть в карточку аналогичного размера (для баланса), либо переосмыслить сетку (Grid/Flex), чтобы секция выглядела гармонично, симметрично и премиально.

### R3. Премиальный дизайн (UI/UX Pro Max)
Опираться на скилл `ui-ux-pro-max`. Избегать визуальных "дыр". Соблюдать правильные отступы (spacing) и визуальный вес (visual weight). Композиция должна быть идеальной.

### R4. Протокол двух команд (Dual-Team)
- **Команда Верстальщиков:** Переписывает структуру Grid/Flex и размеры.
- **Команда Аудиторов:** Обязательно использует `browser` subagent для рендеринга страницы. Они должны "своими глазами" увидеть, что кривизна исчезла, и элементы выровнены симметрично на десктопном разрешении.

## Acceptance Criteria

### Программная и визуальная верификация
- [ ] Левый и правый блоки под главным текстом визуально сбалансированы (имеют одинаковую высоту или гармонично вписаны в сетку).
- [ ] Адаптивность не сломана (на мобильных устройствах блоки корректно выстраиваются в колонку).
- [ ] В отчете аудиторов есть подтверждение визуальной проверки через браузер.


## Follow-up — 2026-06-29T10:17:45Z

# Teamwork Project Prompt — Draft

> Status: Launched
> Goal: Craft prompt → get user approval → delegate to teamwork_preview

Add a third subsection for "summer programs" within the Opportunities section. The UI should display summer programs similarly to the existing olympiads and competitions, using existing data fetching/scraping infrastructure.

Working directory: c:\Users\alibe\Desktop\compass-main
Integrity mode: development

## Requirements

### R1. UI Updates in OpportunitiesView
- Add a new category/tab for "Summer Programs" alongside "Olympiads" and "Competitions" in `OpportunitiesView.tsx`.
- Ensure summer programs are filtered and displayed properly when the tab is clicked.

### R2. Data Model & Fetching
- The existing scraper and data structures (`CompetitionCategory`) should be leveraged to include summer programs.
- The agent team should decide whether to add seed data directly to `key-dates.ts` or as a Supabase migration, following existing patterns in the project.

### R3. Content Population
- Populate the system with real, representative summer programs (e.g., top-tier research programs or summer schools) using the exact same structure as existing competitions.

## Verification Resources
- Use existing patterns, types, and logic already implemented in the project as the primary reference (e.g., `lib/data/key-dates.ts`, `app/api/cron/sync-dates/route.ts`, and `OpportunitiesView.tsx`).

## Acceptance Criteria

### UI & Functionality
- [ ] The Opportunities page shows three tabs: All, Olympiads, Competitions, Summer Programs (or similar).
- [ ] Summer programs display their deadlines and details when the corresponding tab is selected.

### Data Validation (Programmatic / Agent-as-judge)
- [ ] The `CompetitionCategory` type successfully accommodates the new category.
- [ ] A test script or agent-as-judge confirms that at least 3 valid summer programs are returned by the data layer.

