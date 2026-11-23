# hubs
A repository to group all my study hubs: one folder per area, one subfolder per course.

Course code lives here too, inside the course folder (e.g. [`ai/mastra-101-26`](./ai/mastra-101-26)). Older course projects that already have their own repository (e.g. `react-19-academind-*`, `flutter-cod3r-*`) stay there and are linked from the area that owns them; one moves in only if the course is picked up again.

## Areas
| Area | What's inside | Status |
|---|---|---|
| [staff](./staff) | Staff Engineer with frontend focus: responsibilities, archetypes, certifications | ✅ migrated from [staff-hub](https://github.com/richardborgesdev/staff-hub) |
| [system-design](./system-design) | System design courses ([System Design T4 · LINUXtips · 2026](./system-design/linuxtips-matheus-fidelis-system-design-t4-26)) | ✅ |
| [architecture](./architecture) | Software and frontend architecture, design patterns, courses | ✅ migrated from [architecture-hub](https://github.com/richardborgesdev/architecture-hub) |
| [cloud](./cloud) | Cloud fundamentals and certifications ([AWS Cloud Practitioner CLF-C02](./cloud/udemy-stephane-maarek-aws-cloud-practitioner-clf-c02-26)) | ✅ migrated from [cloud-hub](https://github.com/richardborgesdev/cloud-hub) |
| [web](./web) | Web development courses (React, Vue, TypeScript, JavaScript), demos and references | ✅ migrated from [web-hub](https://github.com/richardborgesdev/web-hub) and [study-hub](https://github.com/richardborgesdev/study-hub) |
| [mobile](./mobile) | Mobile development courses (Flutter, Dart, React Native) and references | ✅ migrated from [mobile-hub](https://github.com/richardborgesdev/mobile-hub) and [study-hub](https://github.com/richardborgesdev/study-hub) |
| [design](./design) | Design references | ✅ migrated from [design-hub](https://github.com/richardborgesdev/design-hub) |
| [games](./games) | Game development references (empty for now) | ✅ migrated from [games-hub](https://github.com/richardborgesdev/games-hub) |
| [english](./english) | English studies: goals, courses (Busuu, Cambly, grammar, pronunciation), cheat sheet and progress | ✅ migrated from [english-hub](https://github.com/richardborgesdev/english-hub) |
| [ai](./ai) | AI engineering: agents, MCP, memory, workflows, Claude Code ([Mastra 101 · 2026](./ai/mastra-101-26)) | ✅ partly migrated from [study-hub](https://github.com/richardborgesdev/study-hub) |
| [algorithms](./algorithms) | Data structures, algorithms and interview practice (DSA patterns, LeetCode, Codility, HackerRank) | ✅ migrated from [study-hub](https://github.com/richardborgesdev/study-hub) |
| [productivity](./productivity) | Productivity tools ([Notion Academy badges · 2026](./productivity/notion-academy-26)) | ✅ |
| [backend](./backend) | Backend fundamentals: runtimes, APIs, databases, caching, messaging ([Node.js para Iniciantes · 2021](./backend/erick-wendel-nodejs-para-iniciantes-21)) | ✅ migrated from [study-hub](https://github.com/richardborgesdev/study-hub) |
| [career](./career) | CV versions and ideas for talks | ✅ migrated from [study-hub](https://github.com/richardborgesdev/study-hub) |
| [finance](./finance) | Personal finance and accounting ([Contabilidade do Zero a Profissional · 2026](./finance/udemy-realiza-treinamentos-contabilidade-essencial-26)) | ✅ migrated from [study-hub](https://github.com/richardborgesdev/study-hub) |
| [library](./library) | Links by topic: algorithms, career, articles, courses, books | ✅ migrated from [study-hub](https://github.com/richardborgesdev/study-hub) |
| infra | Containers, Kubernetes, observability | 🆕 planned |
| go | Go language | 🆕 planned |

## Conventions
- Each area has a `README.md` that works as its index.
- New courses, code included, go straight into the area folder instead of a separate repository. Dependencies, builds and `.env` files stay out of git (see `.gitignore`).
- Courses go in `<area>/<provider>-<course>-<year>/`:
  - With an instructor: `<area>/<provider>-<instructor>-<course>-<year>/` (e.g. `cloud/udemy-stephane-maarek-aws-cloud-practitioner-clf-c02-26/`).
  - When the course name already starts with the provider, the provider is not repeated (e.g. `ai/mastra-101-26/`).
  - The course `README.md` opens with the course link and the instructor, when there is one, and lists the lessons as a numbered list.
- Commits: `chore: <course or area> | <what was done>`.
