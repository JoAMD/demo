# Demo Video Plan

## Structure (~2-3 min)

### Act 1: Hook — Problem (10s)
Show Nitrosend's actual flow builder (or describe it). Key pain: **no way to preview how a flow evaluates before it sends**. One wrong condition = wrong emails to thousands of contacts.

### Act 2: Core Loop — Linear Flow (40s)
1. Open app → "Welcome Series" loaded by default
2. Click **Sam Chen** in Contact dropdown → payload auto-populates
3. Click **Run Trace** → nodes light up orange (executed path)
4. Click first email node → **Step Inspector** shows PASS pill, rendered email preview with `{{ contact.first_name }}` resolved to "Sam"
5. Click **Next →** arrow → steps through second email

**Why it matters:** Shows the basic trace flow, Liquid template resolution, step-by-step navigation.

### Act 3: Branching Logic (50s)
1. Switch to **"Engagement Split"** template → canvas re-renders with split node
2. Click **Run Trace** → split evaluates, takes "yes" branch (Sam has `engagement_rating: high`)
3. Click the split node → inspector shows condition results: `contact.engagement_rating eq high → TRUE`
4. Switch contact to **Alex Rivera** (`engagement_rating: low`, `bounced: true`)
5. Run Trace again → split takes "no" branch, email step **FAILS** (bounced)
6. Click failed node → see error: "Email bounced — delivery failed"

**Why it matters:** Shows branching evaluation, condition drill-down, error states. The split preview with TRUE/FALSE pills is the detail most people miss.

### Act 4: Complex Flow (30s)
1. Switch to **"Tiered Follow-Up"** → canvas shows nested splits (tree layout)
2. Select **Taylor Jones** (enterprise, high opens)
3. Run Trace → both splits take "yes" → enterprise VIP email
4. Quick switch to **Casey Morgan** (free tier, zero engagement) → different path

**Why it matters:** Shows the tree layout scales, different contacts route differently.

### Act 5: Edge Case — No Name Contact (20s)
1. Stay on **"Welcome Series"** or switch back to it
2. Select **no.name@example.com** from Contact dropdown
3. Run Trace → email step passes, preview shows: `Hi there, welcome aboard.`
4. Point out: Liquid `{{ contact.first_name | default: "there" }}` resolved empty string to fallback
5. Show Raw HTML view → template still has `| default: "there"` filter

**Why it matters:** Real-world edge case — empty contact fields. Shows the template engine handles gracefully, not just crashes or shows blank. The `default` filter is doing its job.

### Act 6: Details That Matter (30s)
- **Email preview** — Raw HTML vs Rendered toggle (show both views)
- **Dark mode** toggle → clean transition, no flash
- **Export** button → downloads trace JSON
- **Resizable panels** → drag the divider
- **Arrow keys** → navigate steps without mouse
- **Edge highlighting** → selected path glows, unexecuted nodes dimmed

### Act 7: Close (10s)
"Step debugger for automation flows. See why it routed the way it did, before it sends."

---

## Contact Reference for Demo

| Contact | Email | Engagement | Tier | Bounced | Use for |
|---------|-------|------------|------|---------|---------|
| Sam Chen | sam.chen@example.com | high | gold | false | Happy path, yes-branch |
| Alex Rivera | alex.rivera@example.com | low | free | true | Error path, bounce fail |
| Jordan Kim | jordan.kim@example.com | medium | pro | true | Mid-tier, bounce fail |
| Taylor Jones | taylor.jones@example.com | high | enterprise | false | VIP path, nested splits |
| Casey Morgan | casey.morgan@example.com | zero | free | true | Worst case, all no-branch |
| no.name | no.name@example.com | low | free | false | Empty name edge case |

---

## Small Things to Showcase (the "devil in details" moments)

| Detail | Where | Why it matters |
|--------|-------|----------------|
| Contact auto-populates payload | ContactSelector | No manual JSON editing to test different contacts |
| Liquid `{{ contact.first_name \| default: "there" }}` resolves | Email preview | Shows template engine integration |
| `no.name@example.com` contact (empty name) | Contacts list | Edge case: empty first_name hits the `default` filter, shows "there" instead of blank |
| `bounced: true` contacts fail email step | Execution engine | Real-world guard: bounce check before send |
| Split condition pills show actual resolved value | SplitPreview | `→ high` not just `TRUE` — you see what the engine saw |
| Unexecuted nodes dimmed (opacity-50) | StepNode | Visual distinction between ran and didn't-run |
| `findPath` highlights edges on selected path | FlowCanvas | Click a node, see the exact path from trigger |
| Panels close/reopen via floating buttons | TraceDock | Don't lose canvas real estate when inspecting |
| JSON parse error inline | JsonEditor | Invalid JSON shows red border + message before you run |
| Theme persists via localStorage | App.tsx | Come back, still dark mode |

---

## Recording Tips

- **No narration needed** — let the UI speak. Add text overlays for 2-3 key moments ("Liquid resolves template variables", "Condition evaluation: TRUE/FALSE", "Bounced email caught before send")
- **Cursor highlight** — use a cursor highlight tool so clicks are visible
- **Run in dark mode** — looks cleaner on video, switch to light briefly to show the toggle works
- **Use Sam Chen first** (happy path), then Alex Rivera (error path) — contrast makes the value clear
- **Speed up the Run Trace delay** — the 300ms setTimeout is fine for UX but might feel slow on video. Either speed it up or cut between runs
