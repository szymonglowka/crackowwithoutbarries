# Hackathon plan — 4 parallel Muse Code agents (~1 day)

Foundation is done on `main`: Docker stack, data model + matching, `/api/meta|sources|places`,
sample data covering every reliability state, React shell (router, layout, nav, shared components,
lazy map), `AGENTS.md`, `docs/API.md`, `docs/SPEC.md`, one brief per agent in `docs/agents/`.

## Agents

| ID | Brief | Branch | Critical deliverable |
|---|---|---|---|
| A1 | `docs/agents/A1-data-api.md` | `agent/a1-data` | reports + history API (others depend on it), OSM import |
| A2 | `docs/agents/A2-routing.md` | `agent/a2-routing` | GraphHopper + `/api/route/` + `/trasa` |
| A3 | `docs/agents/A3-search-place.md` | `agent/a3-search` | `/szukaj`, `/miejsce/:id` (key demo screens) |
| A4 | `docs/agents/A4-profile-report-content.md` | `agent/a4-content` | `/moje-potrzeby`, `/zglos`, home, `/dane`, `/dla-firm`, `/dla-miast`, pitch |

File ownership is disjoint (see `AGENTS.md`), so merges should be conflict-free. Dependencies are
handled by the contract in `docs/API.md` — nobody waits; missing endpoints = graceful error state.

## Running them

Each agent needs its own checkout. Either let a lead Muse session spawn 4 children **with isolated
worktrees**, or create them yourself and open one `muse` per folder:

```bash
git worktree add ../bp-a1 -b agent/a1-data
git worktree add ../bp-a2 -b agent/a2-routing
git worktree add ../bp-a3 -b agent/a3-search
git worktree add ../bp-a4 -b agent/a4-content
```

Docker: run ONE stack from the main checkout for manual testing; agents verify with
`npx vite build` / `manage.py check` / tests in their own worktree. (Optional: give each worktree its own
stack with `COMPOSE_PROJECT_NAME=bp-a1` and different ports — usually not worth it.)
A2 needs to run GraphHopper itself; A1 needs the DB for migrations — they can use the shared stack
by running commands from their worktree against it, or temporarily point the main stack at their branch.

Prompt to start each agent (replace the ID):

> You are agent **A3** in a 4-agent hackathon team. Read `AGENTS.md`, `docs/API.md` and
> `docs/agents/A3-search-place.md`, then implement the brief in priority order. Stay strictly inside the
> files you own. Commit after each working milestone on branch `agent/a3-search`. Speed matters more
> than perfection, but every product rule in AGENTS.md is mandatory. When done, write a short
> `docs/agents/A3-DONE.md`: what works, what doesn't, anything other agents must know.

## Timeline (adjust to your real deadline)

| Time | Milestone |
|---|---|
| T+0 | All 4 agents start. |
| T+2h | **Merge #1:** A1 reports/history, A4 `/moje-potrzeby`, A3 list + card MVP. A2: GraphHopper running and answering a raw route. |
| T+5h | **Merge #2:** A1 OSM import + fixture, A2 `/api/route/` + basic `/trasa`, A3 map + history, A4 `/zglos` + home + `/dane`. |
| T+7h | **Merge #3 / feature freeze:** content pages, widget, polish. Everyone: keyboard + 375 px pass. |
| T+8h | Demo rehearsal on the jury path (SPEC "Ścieżka demonstracyjna"), record the 3-min video, export slides PDF. |

Merge order each round: A1 → A3 → A4 → A2 (backend first). After merging, every agent rebases:
`git fetch && git rebase main`.

## Integration checks after every merge (you / lead session)

```bash
docker compose up -d --build
docker compose exec backend python manage.py check
docker compose exec backend python manage.py test
docker compose exec frontend npx vite build && rm -rf frontend/dist
```
Then click the jury demo path at 375 px with the keyboard only.

## Cut list if time runs out (in this order)

1. A2 step-by-step "Rozpocznij" mode, desktop step↔segment highlighting.
2. A3 widget + bottom sheet on map (keep list + map).
3. A1 Kraków open-data importer (keep the "unavailable" source state as the demo case).
4. A4 `/faq`, `/regulamin` depth.
Never cut: place card with sources/dates/statuses, conflict + missing + source-down states,
`/dane`, `/dla-firm`, `/dla-miast`, keyboard accessibility.
