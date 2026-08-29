## Strict Courtroom Audit Protocol
When delegating complex analysis, refactoring, or code review tasks to a multi-agent system (like `teamwork_preview`), always enforce a "strict courtroom debate" mode in the prompt. 
1. Instruct the team to split into specialized, adversarial roles (e.g., Clean Code Advocate, Performance Critic, UI/UX Inspector).
2. Mandate that agents cross-examine each other's code and decisions line-by-line to expose vulnerabilities, edge cases, and technical debt.
3. The team must not output a final result until a rigorous consensus is reached that meets an "absolute premium standard" of architecture and quality.

## Premium Layout Standards (Ultrawide)
1. **No Unbounded Widths:** Never use `w-full` for reading-heavy views or data-dense dashboards on large screens. It breaks typographical F-patterns and creates massive dead space.
2. **Centralized Containers:** Always use the `<Container>` component (e.g., `<Container size="reading">` -> `max-w-7xl`, or `<Container size="dashboard">` -> `max-w-[100rem]`) to center and constrain content gracefully on 4K monitors.
3. **Performance:** When building wide, data-heavy views (like Kanban boards), always wrap array sorting/filtering in `useMemo` to prevent main-thread locking during resize and re-renders.
