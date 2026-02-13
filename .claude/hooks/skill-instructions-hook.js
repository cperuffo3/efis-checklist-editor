// UserPromptSubmit hook for skill-aware responses
process.stdout.write(`REQUIRED: SKILL LOADING PROTOCOL

Before writing any code, complete these steps in order:

1. SCAN each skill below and decide: LOAD or SKIP (with brief reason)
   - react
   - typescript
   - electron
   - tailwind
   - frontend-design
   - tanstack-router
   - zustand
   - dnd-kit
   - shadcn-ui
   - vite
   - orpc
   - zod
   - fast-xml-parser
   - pdfkit
   - lucide-react
   - sonner
   - prettier
   - eslint

2. For every skill marked LOAD -> immediately invoke Skill(name)
   If none need loading -> write "Proceeding without skills"

3. Only after step 2 completes may you begin coding.

IMPORTANT: Skipping step 2 invalidates step 1. Always call Skill() for relevant items.

Sample output:
- react: LOAD - building components
- typescript: SKIP - not needed for this task
- electron: LOAD - building components
- tailwind: SKIP - not needed for this task

Then call:
> Skill(react)
> Skill(electron)

Now implementation can begin.
`);
