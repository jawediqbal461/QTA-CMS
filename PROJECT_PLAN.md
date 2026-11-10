# QTA CMS project plan

Status: Proposed · Baseline reviewed November 10, 2026 · Scope: single-academy MVP through multi-academy SaaS

## Product direction

Launch Quran Tutors Academy as a Quran-focused tutoring marketplace operated by QTA. Families can browse tutors or submit a learning request. QTA approves tutors and matches requests during the MVP. Add tutor self-service matching after the pilot, then sell isolated academy workspaces as SaaS. Keep lesson sales, optional tutor memberships, and academy subscriptions as separate commercial products.

## Marketplace and learning product scope

The reference sites offer two discovery paths: browse tutors or post a learning requirement. QTA will adopt both paths, with private in-platform responses and paid access to eligible lead contacts. The QTA plan also includes booking, lesson delivery, study resources, and progress tracking.

References: [MyPrivateTutor UAE homepage](https://www.myprivatetutor.ae/) · [UAE student help](https://www.myprivatetutor.ae/help-center/student) · [UAE tutor help](https://www.myprivatetutor.ae/help-center/tutor)

| Surface | MVP | Paid launch and SaaS |
|---|---|---|
| Public site | Home with Find a Tutor and Request a Tutor actions. Search by Quran program, teaching language, timezone or availability, and rate when published. Public tutor profiles show qualifications, teaching format, and verification status. Include Programs, Pricing, Resources, Quran Reader, Become a Tutor, FAQ, and support. | Search-friendly program and language landing pages, verified lesson reviews, Arabic navigation, and branded academy pages. |
| Requests and matching | Collect program, level, language, timezone, availability, and optional budget. Guardians submit on behalf of children. Staff review and share an anonymized brief with approved tutors. Family accepts a match and books a trial. | Tutor opportunity inbox, scoped proposals, in-platform messaging, notifications, reporting and moderation. Track open, matched, booked, closed, and expired requests. |
| Tutor portal | Apply, submit credentials privately, edit profile and availability, respond to assigned requests, manage lessons, record attendance, and share approved resources and progress. | Browse eligible opportunities, manage recurring schedules, see earnings or membership status, and track proposals and lesson outcomes. |
| Student and guardian portal | Manage learner profiles, requests, matching, trial and lesson bookings, assignments, and progress. Save reader settings and bookmarks. | Messaging, package balance, invoices, payment history, cancellation or rescheduling requests, and progress reports by learner. |
| Admin CMS | Review tutor applications and requests, manage matches, publish pages and learning resources, and handle booking and support exceptions. | Configure regional price catalogs, refund permissions, moderation queues, academy branding, and reporting. |
| Resources library | Publish approved Qaida, Tajweed, Hifz, Arabic practice, worksheets, PDFs, audio, and lesson guides. Filter by program, level, language, and format. Support public and enrolled-only access with server checks. Record author, attribution, license, and revision. | Add tutor-curated collections, per-student assignments, completion tracking, and academy-private libraries. |
| Quran reader | Browse by Surah or Juz, jump to an ayah, and resume reading. Set Arabic font family, size, line spacing, and theme. Offer optional translation and store preferences locally for guests and across devices for signed-in users. | Add licensed recitation audio, ayah repeat, reading plans, and tutor-linked assignments. Roll out full Arabic navigation after bilingual usability testing. |

### Tutor course creation and publishing

Include the full workflow in the MVP. The existing admin curriculum editor and homepage syllabus explorer provide a starting point for the public catalog.

1. **Create a draft in the tutor portal.** An approved tutor enters title, description, program, level, teaching language, prerequisites, learning outcomes, format, and duration. They add ordered syllabus modules and lessons, a week-by-week timeline with milestones, and approved resource attachments. For scheduled cohorts, include start date, timezone, schedule, and capacity. Link a pricing offer where applicable.
2. **Submit for review.** Validate required fields, save a version, and move it to Pending Review. The tutor can track status and reviewer feedback. The admin reviews the syllabus, timeline, resources, Quran content, public copy, and any pricing or scheduling details.
3. **Approve and publish.** Admin can request changes with feedback, reject with a reason, or approve and publish the reviewed version. Published courses appear on the public Courses page and the tutor's profile, with a course detail page and a trial or enrollment action. Drafts and pending submissions are private.
4. **Manage revisions.** Tutors submit edits as a new version for review. The published version remains visible until an admin approves its replacement. Admin can unpublish or archive a course, with an audit record and a separate decision about access for existing learners.

Acceptance: a tutor can draft a course with a syllabus and timeline, submit it, respond to feedback, and see the approved version appear publicly. Direct URL and API checks confirm that unpublished versions stay private. Tutors cannot approve courses or edit another tutor's course.

### Arabic RTL and Quran content acceptance

- Set `lang="ar"` and `dir="rtl"` on Arabic reading content independently of the interface locale. Set document direction from the interface language when Arabic navigation ships. Use CSS logical properties and direction-aware controls. Isolate mixed-script translations, ayah numbers, prices, and timestamps so they remain readable.
- Offer at least two approved, licensed Arabic fonts with a readable fallback and a settings reset. Test diacritics, ligatures, ayah markers, font loading, zoom, and line wrapping on mobile and desktop. Font and layout controls must preserve the verified verse text.
- Use a vetted, versioned Quran source and review representative passages and script/font combinations before release. Check keyboard navigation, screen-reader language changes, and font preferences in English-interface and Arabic-interface layouts. Display attribution for translations, fonts, and recitations as required.

### Pricing and payment scope

- MVP publishes trial terms, package inclusions, lesson duration, cancellation terms, and regional currency. Admin configures offers and handles approved manual payments during the pilot. Set amounts after confirming launch market, tutor costs, and pilot demand.
- Paid launch starts with one merchant market and one hosted checkout provider. Select the provider after confirming merchant eligibility, payout and settlement currency, supported payment methods, refunds, fees, and recurring payment capabilities. Treat Pakistan and UAE as candidate markets pending that decision.
- Store price versions, currency, and final totals with the order. Confirm payment through verified server webhooks. Handle checkout expiry, retries, duplicate events, partial or full refunds, and package-credit adjustments. Provide invoices or receipts and a finance reconciliation view. Keep payment card collection on the provider's hosted flow.
- Include tutor membership checkout and contact unlock in the paid marketplace launch. Define plan price, unlock allowance, renewal, cancellation, and refund rules before checkout goes live. Keep tutor membership billing separate from family lesson payments and later academy subscriptions.

### Tutor registration and paid contact unlock

1. **Register and apply.** The tutor verifies their email, completes their profile and availability, and submits credentials for admin review. Approved tutors can view eligible anonymized requests. Rejected or suspended tutors lose lead access.
2. **Pay for membership.** The tutor selects a plan and completes hosted checkout. A verified payment event activates the entitlement on the server. Pending and failed payments leave contacts locked.
3. **Unlock a specific lead.** A tutor selects an open, eligible request. The server checks tutor approval, active membership, any unlock allowance, and the request owner's explicit consent to share each contact method. Reveal only the permitted email or phone in the tutor portal. For minors, show the consenting guardian's details. Requests without consent remain available through in-platform messaging where eligible.
4. **Record and enforce access.** Keep contact fields out of public listings, previews, and shared search indexes. Record each unlock with the tutor, request, and timestamp. Make retries safe so the allowance is consumed once per grant. Block future display after expiry, suspension, refund that revokes entitlement, request closure, or consent withdrawal.

Paid launch acceptance: an approved tutor can register, pay, and reveal an eligible contact end to end. Unapproved tutors, unpaid tutors, and tutors without a valid grant cannot retrieve the contact through either the UI or API. Test duplicated payment events and repeated unlocks, as well as expired memberships and withdrawn consent.

## Repository review

| Area | Current implementation | Launch gap |
|---|---|---|
| Public site | Vite/React routes for tutors, profiles, blogs, and Quran Explorer | Replace demo content, verify Quran sources, and check public pages on mobile and with assistive technology |
| Identity and CMS | Client-side demo admin and browser-local edits | Server-verified sessions, permissions, persistent records, and audited publishing |
| Scheduling | Local booking and lesson state shared through App.tsx | Transactional booking, timezone handling, cancellations, and reminder delivery |
| Classroom and progress | Simulated classroom and seeded progress data | Real joining flow, access windows, attendance, and tutor-approved progress |
| Engineering | Vite build passed in the prior local check. TypeScript reported eight errors involving Vite client types | Restore type checking and add CI and critical workflow tests |

The repository contains a QA report, a starter README, and architecture sketches in [mockData.ts](src/data/mockData.ts), with sample Next.js routes under [nextjs-reference](src/nextjs-reference). The QA report includes a priority list. Its empty-lockfile and unsplit-bundle findings describe an older snapshot. The current repo has a populated lockfile and the prior production build emitted route chunks. Recheck older functional findings as part of Phase 0.

## Competitor feature gaps

The Quran-specific comparison uses [Qutor.com](https://qutor.com/). Priorities below refer to the existing delivery phases. Local drawing, verse highlighting, displayed tutor ratings, and wallet UI are already present as prototype elements. The gaps are the underlying shared classroom, verified review workflow, and reconciled balances.

| Feature observed | QTA gap and proposed scope | Target and acceptance |
|---|---|---|
| MyPrivateTutor UAE lead filters and watchlist | Add a tutor opportunity inbox with program, language, availability and request freshness filters. Tutors can save requests and opt into matching alerts. | Phase 2. Saved requests show closure status and never reveal contact without a valid grant. |
| MyPrivateTutor UAE profile promotion and reputation | Add profile completeness guidance, review requests after completed lessons, and review moderation. Offer labeled sponsored placement only after search and trust metrics are established. | Phase 2 for reviews. Phase 4 candidate for promotion. Reviews require a completed lesson and can be reported. |
| MyPrivateTutor UAE institute directory | Add verified public academy profiles with tutors, published courses, and an enquiry action. | Phase 3. Workspace admins can manage their listing and only approved public records appear. |
| MyPrivateTutor UAE study notes and educational Q&A | Expand the planned resource library with tutor submissions and sample previews. Add moderated Ask a Tutor questions later. | Phase 2 for submissions. Phase 4 candidate for Q&A. Moderators can reject uploads or redact private details before publication. |
| MyPrivateTutor UAE activity reward points | Consider rewards for useful approved contributions or referrals. Keep promotional rewards separate from paid lead allowances and lesson credits. | Phase 4 candidate. Pilot only with anti-abuse controls and a measurable improvement in approved contributions. |
| Qutor tutor skills evaluation and discovery | Add a subject-level approval checklist with a live recitation or Hifz assessment, public verified skills, and optional tutor gender preference in search. | Phase 1. A tutor can only advertise specialties an authorized reviewer has approved. |
| Qutor free classroom trial and compatibility check | Add configurable trial eligibility and a pre-lesson camera/mic check with help for denied permissions. Let families keep separate tutor relationships for Tajweed, Hifz, or Arabic. | Phase 1. A family can book an eligible trial, check devices, and book a different tutor for a different subject. |
| Qutor live Quran workspace | Build on the existing local viewer and whiteboard. Add synchronized Surah/ayah navigation and highlights, shared drawing, session chat, and approved resource sharing alongside live audio/video. Preserve independent font and RTL settings. | Phase 4. Two authorized participants see shared updates and reconnect to the same state. |
| Qutor Parental Watch and archiving | Start with guardian attendance, notes and homework summaries. Evaluate recording and playback separately after approvals for consent, retention, access, and deletion. | Phase 2 for summaries. Phase 4 candidate for playback. Only authorized guardians see summaries or approved media for their linked learners. |
| Qutor classroom credits, usage billing and ending engagements | Keep package checkout at paid launch. Evaluate top-ups, session-minute billing and a tutor earnings ledger after finance validates usage and settlement rules. Add a way for families to end a recurring tutor arrangement and review future bookings. | Phase 2 for ending arrangements. Phase 4 candidate for metered billing. Reconnection and duplicate events cannot charge for the same minutes twice. |

Sources: [MyPrivateTutor UAE tutor help](https://www.myprivatetutor.ae/help-center/tutor) · [UAE institute onboarding](https://www.myprivatetutor.ae/become-an-institute) · [UAE Q&A terms](https://www.myprivatetutor.ae/terms) · [MyPrivateTutor India learner help](https://www.myprivatetutor.com/help-center/learner) · [Qutor FAQ](https://qutor.com/faqs) · [Qutor tutor evaluation](https://qutor.com/about) · [Qutor homepage](https://qutor.com/) · [Qutor fees](https://qutor.com/quran-learning-fees)

## Delivery roadmap

Estimates are elapsed engineering weeks for two engineers with part-time academy operations, content review, and QA support. They exclude provider approval, procurement, and time needed to collect pilot evidence. Assign named owners and recalibrate after Phase 0.

| Phase | Estimate | Scope | Exit gate |
|---|---:|---|---|
| 0. Foundation | 1–2 weeks | Establish CI and environments. Confirm the pilot geography, content source, identity model, and booking policy. Remove misleading demo claims and placeholder content from the pilot build. | Clean install, type check, and build pass in CI. Release blockers have owners. Staging is available with synthetic data. |
| 1. Single-academy MVP | 4–6 weeks | Real identities, guardian/student links, tutor publishing, availability, booking, meeting links, lesson records, and basic admin operations. Operate billing manually during the pilot. | Two families and two tutors complete the full staging workflow. Concurrent attempts for one slot yield exactly one booking. Unauthorized users cannot access another family's records. Backup restoration is exercised. |
| 2. Paid academy launch | 4–6 weeks, provisional | Family checkout, tutor membership checkout, consent-based contact unlock, refunds and reconciliation, reminders, cancellation and rescheduling, and support workflows. | Approved tutors can pay and unlock eligible contacts. Staff reconcile both payment flows. Duplicate and out-of-order provider events preserve correct records. Re-estimate after provider and membership rules are selected. |
| 3. Multi-academy SaaS | 6–10 weeks | Academy workspaces, invitations, tenant isolation, branding, data import/export, subscriptions, entitlements, and assisted onboarding. | Two independent pilot academies onboard. Cross-tenant access checks pass across APIs, storage, exports, and background jobs. Workspace billing and cancellation reconcile independently. |
| 4. Advanced SaaS | 8–12+ weeks, delivered in increments | Evaluate embedded video, calendar sync, cohort learning, enterprise identity, and AI-assisted tutor workflows. | Each increment has a customer sponsor, a measurable target, acceptable unit cost, and a rollback or disable control. |

## Phase 0 and MVP backlog

### Phase 0 handoff

| Gate | Evidence and remaining work |
|---|---|
| F01 engineering | Vite client types and GitHub Actions are configured. The local production preview served the app shell at `/`, `/tutors`, `/signup/tutor`, `/quran`, and `/admin`. Engineering still needs a restricted hosted staging target and a GitHub Actions run. Test form and portal interactions on that target with synthetic data. |
| F02 academy operations | Proposed pilot: one invite-only online cohort, adults or learners with guardian-managed accounts. A guardian creates the learner profile and controls contact sharing. Use booked, completed, cancelled, and no-show states. Propose free rescheduling or cancellation up to 24 hours before class, with later exceptions reviewed by staff. The academy lead must approve these rules, pilot geography and age range, support hours, and a named escalation owner. |
| F03 content and media | The current demo uses embedded verse and translation samples, externally hosted recitation URLs, and sample tutor media. The content lead must record the canonical Quran edition and source version, translation author and rights, reciter and audio rights, font licenses, and tutor media consent. Keep unverified items out of the real-user catalog until the reviewer signs off. |

Staging target: `new.qurantutorsacademy.com`. The site owner will configure hosting and DNS later. Configure SPA rewrites and restrict staging access. Use synthetic accounts for portal testing. Use managed PostgreSQL and identity for Phase 1 and provider meeting links for lessons. Engineering must confirm the hosting account, region, backup and restore capabilities, and meeting provider before opening the pilot.

### Existing Quran section migration

Use the existing [Quran section](https://qurantutorsacademy.com/quran/) as the migration source. Keep `/quran/` as the Surah index and preserve every source page's exact relative path, including its slug and trailing slash. The prototype currently redirects the index to a reader route and generates different slugs. Import the legacy URL list from the source rather than deriving slugs from Surah names.

Import each page's title, headings, Arabic text or reading images, explanatory content, and audio and other media references from the original export. Preserve original order, text, and public paths. Keep imported content separate from demo data. Reader font and RTL controls can change presentation while preserving the imported text. Record media dependencies and copy assets from an authorized export where continued access to the original host is uncertain.

Migration baseline: the July 26 WordPress SQL backup contains the Quran index and 114 published Surah records. The app imports the published page bodies and original slugs, and follows the live index order. The legacy `/quran/surah-yasin/` link opens the backed-up Yaseen page. The import converts WordPress layout and audio shortcodes into HTML and retains the existing media URLs. The companion ZIP has 30 of the 31 referenced QTA upload paths, totaling approximately 148 MB. The original Al Fatihah MP3 path was absent from that ZIP.

Release gate: compare the backup content with the current site for post-backup changes, check direct loads and internal links on staging, and verify remote media playback. Preserve or separately deploy the legacy media if the original host will stop serving it.

### Existing blog migration

The July 26 WordPress backup supplies 25 published articles. Serve the archive at `/blog/` and article paths from the backup's Yoast permalink index. Preserve article titles, dates, categories, and body content. Copy referenced blog images from the backup to the existing upload paths. Verify the archive, article deep links, and images on staging, and reconcile changes published after the backup date before cutover.

| ID | Priority | Work and owner role | Depends on | Acceptance |
|---|---|---|---|---|
| F01 | P0 | Engineering: add Vite client types, clean CI install, build, and staging deploy | — | Reproducible build and successful staging deploy from a clean checkout |
| F02 | P0 | Academy lead: approve guardian onboarding, lesson status rules, cancellation policy, and pilot support hours | — | Written policies and an assigned escalation owner |
| F03 | P0 | Content lead: inventory Quran text, translations, audio rights, and public tutor media | — | Approved sources and reviewer sign-off recorded. Unverified content is hidden |
| M01 | P0 | Backend: provision database, migrations, workspace seed, managed identity, and authorization | F01, F02 | Admin, tutor, and guardian sessions have distinct permissions enforced on the server. Revoked access takes effect |
| M02 | P0 | Product engineering: tutor onboarding, approval, profiles, and availability | M01, F03 | An approved tutor appears in the directory. Draft and withdrawn profiles stay private |
| M03 | P0 | Product engineering: guardian and student linking, booking, rescheduling, and cancellation | M01, M02 | Slot collisions are prevented atomically. Retries are safe. Both parties see the same status and local time |
| M04 | P0 | Product engineering: meeting access, attendance, lesson notes, and progress | M03 | Only assigned users can retrieve the meeting link. Completion saves attendance and one progress update even on retry |
| M05 | P0 | Operations and QA: admin recovery, audit trail, backup/restore, and end-to-end pilot rehearsal | M01–M04 | Staff can resolve a missed lesson and recover a backup. Critical workflows pass on desktop and mobile |
| M05a | P0 | Academy administration: manage teacher, student, and guardian accounts from the live dashboard | M01–M03 | Staff can search by name, email, or account ID, inspect and edit profiles, see learner–guardian links, and suspend, revoke, or restore academy access. Revocation preserves lesson history. Changes are scoped to the academy and audited. |
| M05b | P0 | Verified accounts and student, guardian, and teacher desks | M01–M04 | Signup requires email confirmation before sign-in. Desks show profile settings, upcoming lessons, teacher or learner relationships, and portal and email class updates. Rescheduling invalidates the old reminder. |
| M06 | P1 | Frontend and QA: accessible controls, empty/error states, public content and metadata | F03, M02 | Keyboard and screen-reader smoke checks pass on booking and lesson entry. Published pages have correct metadata |
| M07 | P0 | Product engineering and operations: tutor request and staff-assisted matching | M01, M02 | A guardian can submit a request, review a tutor match, and book a trial. The tutor sees only the approved brief and relevant assignment. |
| M08 | P0 | Content and frontend: public resource catalog and Arabic RTL reader | F03 | Approved resources are discoverable. Restricted files require access. Font settings persist and verified Arabic renders correctly in mixed-direction layouts. |
| M09 | P0 | Product and finance: public pricing and pilot payment handling | F02, M03 | Families see the correct offer, currency, trial terms, and cancellation rules. Staff can reconcile a pilot payment against a booking. |
| M10 | P0 | Product engineering and content: tutor course editor, admin approval queue, and public catalog | M01, M02, M08 | A course with syllabus and timeline completes draft, review, and publish. Public pages only serve approved published versions. |

For MVP, defer in-app video, recordings, tutor payouts, marketplace search across academies, recurring billing, and AI scoring. Use private provider meeting links and manual reconciliation. Launch the verified Quran Explorer catalog only when the content gate passes.

## Architecture and data

- Keep the existing React/Vite frontend for the MVP. Use managed PostgreSQL and managed identity, with Supabase as the proposed option from the repository sketch. Put privileged writes behind a small server API or server functions. Confirm region, backup capabilities, and operating cost in Phase 0. Consider a server-rendered public site after measuring discoverability.
- Start with one seeded academy and carry `academy_id` on academy-owned records from the first migration. Model accounts, academy memberships, guardian-student links, tutor profiles, availability, bookings, lesson sessions, progress entries, curriculum, content revisions, and audit events. Add subscriptions, invoices, payment events, and entitlements in their delivery phases.
- Enforce tenant membership and role checks at the server boundary and database level. Guardians see only linked students. Tutors see assigned lessons and permitted student records. Academy admins manage their workspace. Platform support uses narrowly scoped, time-limited, audited access. Public readers see published projections.
- Store booking timestamps in UTC and availability rules in the tutor's IANA timezone. Make the database enforce non-overlapping active bookings for each tutor. Define explicit transitions for booked, rescheduled, cancelled, completed, and no-show lessons. Write status changes and notification jobs together. Retry delivery with deduplication and expose failed jobs to staff.
- Use managed object storage with private access for sensitive files. Separate verified Quran source records from CMS copy. Version the source and reference stable surah/ayah IDs from assignments and progress. Require content review before publishing source updates.
- Replace localStorage business records in the real-user app. Keep browser storage for UI preferences. Treat existing demo records as synthetic and import production tutor and curriculum data from a reviewed template with preview, duplicate checks, and a reversible batch ID.

## Paid launch and SaaS delivery

| Workstream | Delivery sequence | Acceptance |
|---|---|---|
| Billing | Confirm merchant eligibility and currency in the launch market. Start with hosted checkout and server-confirmed payment state. Add academy subscription plans, seat limits, and grace periods in Phase 3. | Refunds and failed payments reconcile against provider statements. Plan changes affect only the intended workspace. |
| Notifications | Start with booking, cancellation, and reminder email. Add delivery monitoring, preference controls, and escalation for failed sends. | Retries avoid duplicate messages. Family-facing messages show local time and omit sensitive lesson notes. |
| Tenant operations | Assisted onboarding, membership invites, import validation, branding, scoped exports, and workspace offboarding. | Staff can onboard and offboard an academy end to end. Imports and exports retain workspace boundaries and emit audit records. |
| Advanced classroom | Measure failed joins and tutor demand. Pilot embedded video and a shared verse pointer. Add recording only after consent, retention, and access rules are approved. | Pilot users can reconnect and recover the shared classroom state. Support can switch back to provider links. |
| AI and enterprise | Test tutor-assist notes using approved data and tutor review. Add SSO and audit exports when customer contracts justify them. | Tutors approve feedback before families see it. Processing cost and quality are measured. Enterprise access revocation is verified. |

## Launch controls and measures

- Test policy boundaries for each role and tenant, booking collisions, retries, timezone and daylight-saving changes, mobile lesson joining, content publishing, and payment reconciliation when enabled. Run type checks and builds on every pull request. Add end-to-end tests for signup through completed lesson and each release's new critical flows.
- Maintain separate staging and production, runtime secrets, monitoring, and error alerts. Before enabling paid accounts, rehearse database restoration and define rollback steps for application releases and migrations. Proposed paid-launch targets are 99.5% monthly booking/API availability, recovery within four hours, and at most 24 hours of data loss. Tighten targets as contracts require.
- Collect the minimum student information needed for lessons. Before enrolling minors, confirm guardian consent, retention, export, deletion, and recording rules for the pilot geography. Assign a named owner for incidents and family support. Keep personal information out of analytics and operational logs.
- Instrument directory visits, booking confirmation, attendance, first completed lesson, repeat booking, support requests, and workspace activation. Initial pilot targets are at least 90% successful joins for scheduled lessons and zero unresolved unauthorized-access or double-booking incidents before wider rollout. Review conversion, retention, and lesson margin after the first billing cycle to set growth targets.

## Decisions to close before implementation

| Decision | Owner role | Due |
|---|---|---|
| Pilot geography, learner age range, and first cohort | Academy lead | Phase 0 |
| Guardian permissions, cancellation windows, and progress rubric | Academy and tutor leads | Phase 0 |
| Hosting region, identity/database provider, and meeting provider | Engineering lead | Phase 0 |
| Verified Quran sources, attribution, and publishing approval | Content lead | Phase 0 |
| Payment provider, currency, refunds, and who handles reconciliation | Finance and operations | Before Phase 2 |
| Subscription pricing, included seats, support expectations, and offboarding policy | Product and operations | Before Phase 3 |

Begin with F01, F02, and F03 in parallel. Once those decisions and the staging baseline are in place, deliver M01 through M04 as one booking-to-progress workflow before expanding the catalog or classroom features.
