Create a responsive web app called IAP Builder. This is a smaller, focused product for emergency management and public safety teams that need to create Incident Action Plans by tying information together across standard ICS forms and exporting either a full IAP packet or individual forms.

This is not a full incident management platform. It should feel like a focused planning and document assembly tool.

Primary product purpose

Help users build an IAP by organizing all required planning data in one place

Reuse shared data across forms instead of making users enter the same information multiple times

Allow export of either a complete IAP packet or individual ICS forms

Keep the interface simple enough for small and tribal agencies managing Type 4 and Type 5 incidents

Core forms supported
Design the product around these ICS forms and attachments:

ICS 202 Incident Objectives

ICS 203 Organization Assignment List

ICS 204 Assignment List

ICS 205 Incident Radio Communications Plan

ICS 205A Communications List

ICS 206 Medical Plan

ICS 207 Incident Organization Chart

ICS 208 Safety Message / Safety Plan

Optional map/chart and other attachments

Product structure
The app should have a clear workflow centered on one incident and one operational period at a time.

Main sections in the left sidebar:

Dashboard

Incident Info

Operational Periods

Objectives

Organization

Assignments

Communications

Medical

Safety

Contacts

IAP Builder

Export

Main UX concept
Each section is a source of structured planning data. The IAP Builder pulls from those sections automatically to assemble the packet.

Examples:

Objectives entered in the Objectives section automatically populate ICS 202

Organization Assignments populate ICS 203 and can generate an ICS 207 org chart

Assignment entries populate ICS 204

Communications entries populate ICS 205 and ICS 205A

Medical entries populate ICS 206

Safety entries populate ICS 208

Contacts are reusable across Organization, Communications, and Medical

Key screens to design

Dashboard

A clean planning dashboard for the selected incident

Show current operational period, section completion status, draft progress, and recent updates

Show which forms are ready, incomplete, or missing data

Primary action: “Open IAP Builder”

Incident Info

Incident name, incident number, jurisdiction, location, start date/time, incident commander, notes

Keep this simple and form-based

Operational Periods

A screen for creating and selecting operational periods

Show current OP, previous OPs, and the ability to copy forward data from the previous period

Make it clear that forms are assembled for the selected operational period

Objectives

Structured editing for incident objectives, command emphasis, situational awareness, and approvals

Show that these records feed ICS 202 automatically

Organization

Role assignments for Command Staff and General Staff

Allow users to assign names, agencies, contact info, and activated branches/divisions/groups

Show that this feeds ICS 203 and optional ICS 207

Assignments

Create assignment lists for divisions/groups/resources

Include supervisor, work assignment, reporting location, special instructions, and resources

Show that this feeds ICS 204

Communications

Communications plan entries for channels, function, assignment, frequency/talkgroup, remarks

Separate but related communications contact list behavior for ICS 205A

Medical

Med aid stations, transport, hospitals, EMS contact, procedures

Show that this feeds ICS 206

Safety

Safety message or plan entry

Show that this feeds ICS 208

Contacts

Reusable contact records with role, agency, phone, email, and category tags

Contacts should be selectable from Organization, Communications, and Medical rather than retyped

IAP Builder

A central assembly screen showing the IAP packet for the selected operational period

Show included forms in packet order

Allow include/exclude toggles for optional attachments like ICS 207, ICS 208, and map/chart

Show completion states for each form

Show warnings for missing required fields

Include a live right-side preview or packet summary

Export

Final export screen with options to export:
Full IAP packet as PDF

Individual ICS forms as PDF

Draft vs final version


Show selected forms and attachments before export

Design direction

Clean, professional, government-friendly SaaS

Minimal clutter

Strong hierarchy and readability

Calm, practical interface for time-pressured users

Neutral background with one muted accent color like teal or blue

Not flashy, not tactical, not militaristic

Important constraints

This product is narrower than incident management software

Do not include CAD, dispatch, field units, shelter tracking, damage assessment, ambulance dashboards, or broad response management widgets

Keep the app focused on planning data, form assembly, and export

Make the product feel like a document workflow tool for ICS planning

Deliverables to show in the design

Sidebar navigation

Dashboard

One or two detailed form-entry screens

IAP Builder packet assembly screen

Export screen

A clear relationship between source sections and generated ICS forms

Do not redesign this as a full emergency operations platform. Keep it tightly focused on building, reviewing, and exporting IAPs.