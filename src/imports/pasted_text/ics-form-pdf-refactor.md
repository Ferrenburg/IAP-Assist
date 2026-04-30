Refactor the PDF export engine for all ICS forms so it uses fixed-position form rendering instead of flowing text onto a blank template.

The current issue is that values are being placed in the wrong visual locations on the form. The exporter must treat each FEMA ICS form as a strict coordinate-based template with anchored fields, row-by-row table rendering, clipping boundaries, and overflow handling.

Core rendering requirement

Do not place export values by sequential text flow.

Do not append data below the form or let text drift into the next block.

Render each field only inside its assigned block using exact x/y coordinates or equivalent anchored field regions.

Every export field must be tied to a named anchor region on the page.

Text must stay inside the intended block, row, or signature line area.

If text does not fit, wrap within the block, clip appropriately, or continue to a new page depending on the form rules.

Use a field map for every form
Build a deterministic export mapping table for each form with:

form number

block number

field label

x/y position

width and height

alignment

font size

line height

overflow rule

row or table logic if applicable

checkbox rule if applicable

General export behavior

Header fields must stay in the header blocks only.

Footer fields like Prepared By, Signature, and Date/Time must stay on their designated footer lines only.

Table-based forms must render data into rows and columns, not as paragraph text.

Signature, date, and position/title must never overlap the signature lines or the IAP page footer.

Checkbox values must be rendered as checked or unchecked only in the checkbox box area.

Do not print any value if its anchor region is undefined. Instead return a validation warning.

Observed placement issues that must be fixed

ICS 202: Operational period dates and times are rendering in Block 3 Objective(s) instead of Block 2. Prepared by position/title and date/time are colliding with footer lines.

ICS 203: Names are drifting across section headers and into the wrong section columns. Footer values are landing on the bottom line instead of their own fields.

ICS 204: Incident name and operational period values are colliding in the header. Division/supervisor/resource values are being placed in the wrong top blocks and not into proper row cells.

ICS 205: Header values are shifted into the wrong boxes and the channel row values are rendering across the top instead of in row cells.

ICS 205A: Operational period values are rendering over the Basic Local Communications Information heading instead of staying in Block 2. Prepared by data is dropping below the footer.

ICS 206: Transportation row values are being rendered on top of the section title/header instead of inside the table row cells.

ICS 207: Header values and prepared-by values are colliding with the chart and footer. Chart labels must stay inside the chart boxes.

ICS 208: Safety text begins correctly, but some header and footer text overlaps and prepared-by/date positioning is wrong.

Form-specific rendering rules

ICS 202

Block 1 Incident Name must render only inside the Incident Name field box.

Block 2 Operational Period must render Date From, Time From, Date To, and Time To only inside the four date/time positions in the header.

Block 3 Objective(s) must begin below the block label and use wrapped multiline text with consistent left padding.

Block 4 Operational Period Command Emphasis and General Situational Awareness must each stay in their own text area.

Block 5 checkbox area must only mark Yes or No inside the checkbox squares and place Approved Site Safety Plan(s) Located At on its line.

Block 6 checklist must mark only the proper boxes for included forms and place other attachments on the attachment lines, not floating between them.

Block 7 and 8 footer fields must each be individually anchored: Name, Position/Title, Signature, and Date/Time.

ICS 203

All names must render inside the specific role row or cell, not centered across section headings.

Use one anchor region per role line.

For Operations Section, Division/Group labels go in the left operations cells and assigned names go in the paired right cells.

If multiple names fill one role, keep them inside that cell, separated by a slash.

Only activated positions should be populated. Leave all others blank.

Prepared by footer fields must be aligned to their own anchors.

ICS 204

Block 1 and 2 header fields must stay in their assigned boxes.

Block 3 values for Branch, Division, Group, and Staging Area must only populate their labeled lines.

Block 4 operations personnel must place each name/contact only on the correct line.

Block 5 Resources Assigned must render one resource per row across the row cells: Resource Identifier, Leader, Number of Persons, Contact, Reporting Location / Notes.

Do not concatenate resources into the header or Block 4.

Block 6, 7, and 8 must use their own text regions and line rows.

Block 9 footer fields must align to the footer.

ICS 205

Block 1 Incident Name, Block 2 Date/Time Prepared, and Block 3 Operational Period must remain in separate header regions.

Block 4 Basic Radio Channel Use must render one communications entry per row.

Each row must place values in exact columns: Zone Group, Channel Number, Function, Channel Name/Talkgroup, Assignment, RX Freq, RX Tone/NAC, TX Freq, TX Tone/NAC, Mode, Remarks.

Do not place row values in the header area under the title.

Block 5 and 6 must remain in their own regions.

ICS 205A

Block 1 and 2 header values must stay above the table.

Block 3 must render one contact per row with strict column placement: Incident Assigned Position, Name (Alphabetized), Method(s) of Contact.

Do not print operational period values on top of the section heading.

Block 4 footer must remain inside the footer row.

ICS 206

Block 1 and 2 header fields must remain in the top header.

Block 3 Medical Aid Stations must render one station per row.

Block 4 Transportation must render one transport resource per row and place ALS/BLS selection only in the checkbox area.

Block 5 Hospitals must render one hospital per row across the proper columns and checkboxes.

Block 6 procedures text must stay inside the lower procedure text area only.

Blocks 7 and 8 footer values must remain aligned to the footer lines.

ICS 207

Block 1 and 2 header fields must remain in the top header only.

Block 3 Organization Chart must place names inside the corresponding chart boxes and keep text centered within those boxes.

Do not let names float between boxes or into the footer.

Block 4 Prepared by fields must remain on the footer line only.

ICS 208

Block 1 and 2 header values must remain in the top header.

Block 3 safety message text must start below the block label and wrap within the content box.

Block 4 checkbox and location line must stay in the lower safety-plan area.

Block 5 footer values must remain on the footer lines.

Validation before export
Before generating a PDF, validate that every mapped field has:

a target block

a coordinate anchor

a max width and height

an overflow rule

If any required anchor is missing, stop export and return a form-specific error instead of placing the text incorrectly.

Debug requirement
Add a debug mode that draws the field anchor boxes and block boundaries on top of the PDF template so field placement can be visually verified form by form.

Success criteria

No text should overlap a label, line, or neighboring block.

Header values stay in headers.

Footer values stay in footers.

Table values stay in row cells.

Chart labels stay inside chart boxes.

Blank fields remain blank.

Exports match the visual layout of the official FEMA ICS forms.