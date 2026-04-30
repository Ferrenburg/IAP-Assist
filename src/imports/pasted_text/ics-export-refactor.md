Refactor the ICS export system so each ICS form is generated from an exact field-to-block mapping, not from loose text placement.

Treat each FEMA ICS form as a structured template. Map app data into the correct numbered block on the correct form, preserve the official field labels, and ensure that repeated rows, long text, and overflow content are handled correctly.

General export rules

Use the official FEMA block structure and field names for each form.

Populate only the form fields that belong in each numbered block.

Do not combine fields from different blocks.

Preserve checkbox behavior exactly where the form requires checkboxes.

Preserve row-based table behavior for forms with repeating entries.

If content exceeds the available space on page 1, create continuation pages using the same ICS form and repaginate correctly.

Preserve “IAP Page” numbering and repaginate additional pages as needed.

Use operational period start and end date/time in the correct form header blocks.

Use 24-hour time and month/day/year date formatting where required.

Keep text inside the intended block or row and do not spill content into neighboring areas.

If a field is blank, leave the corresponding form area blank rather than inventing text.

ICS 202 mapping rules

Block 1 = Incident Name.

Block 2 = Operational Period, including Date From, Time From, Date To, Time To.

Block 3 = Objective(s), using clear operational objectives for that period.

Block 4 = Operational Period Command Emphasis, plus General Situational Awareness in its own area.

Block 5 = Site Safety Plan Required, using Yes/No checkbox behavior, plus Approved Site Safety Plan(s) Located At.

Block 6 = Incident Action Plan checklist. Mark checkboxes for ICS 203, 204, 205, 205A, 206, 207, 208, Map/Chart, Weather Forecast/Tides/Currents, and list any Other Attachments.

Block 7 = Prepared by, including Name, Position/Title, Signature, and Date/Time prepared.

Block 8 = Approved by Incident Commander, including Name, Signature, and Date/Time.

If objectives or attachments exceed available space, continue on additional ICS 202 pages and repaginate.

ICS 203 mapping rules

Block 1 = Incident Name.

Block 2 = Operational Period header.

Block 3 = Incident Commander(s) and Command Staff, including IC/UCs, Deputy, Safety Officer, Public Information Officer, and Liaison Officer.

Block 4 = Agency/Organization Representatives, with Agency/Organization and Name.

Block 5 = Planning Section, including Chief, Deputy, Resources Unit, Situation Unit, Documentation Unit, Demobilization Unit, and Technical Specialists.

Block 6 = Logistics Section, including Chief, Deputy, Support Branch, Service Branch, Supply Unit, Facilities Unit, Ground Support Unit, Communications Unit, Medical Unit, and Food Unit.

Block 7 = Operations Section, including Chief, Deputy, Staging Area, Branches, Branch Directors, Deputies, Division/Group identifiers in the left column, and assigned names in the right column.

Block 8 = Finance/Administration Section, including Chief, Deputy, Time Unit, Procurement Unit, Compensation/Claims Unit, and Cost Unit.

Block 9 = Prepared by, with Name, Position/Title, Signature, and Date/Time.

Use only activated positions. Not all positions need to be filled.

If more than one person fills a role during the period, separate names with a slash.

If additional branches or rows are needed, add continuation pages and repaginate.

ICS 204 mapping rules

Block 1 = Incident Name.

Block 2 = Operational Period.

Block 3 = Branch, Division, Group, and Staging Area reference values.

Block 4 = Operations Personnel, including Operations Section Chief, Branch Director, and Division/Group Supervisor with contact numbers.

Block 5 = Resources Assigned table, with Resource Identifier, Leader, Number of Persons, Contact, and Reporting Location / Special Equipment / Supplies / Remarks / Notes / Information.

Block 6 = Work Assignments.

Block 7 = Special Instructions.

Block 8 = Communications, including Name/Function and Primary Contact.

Block 9 = Prepared by, including Name, Position/Title, Signature, and Date/Time.

Allow multiple ICS 204 pages, usually one per Division or Group, and repaginate correctly.

ICS 205 mapping rules

Block 1 = Incident Name.

Block 2 = Date/Time Prepared.

Block 3 = Operational Period.

Block 4 = Basic Radio Channel Use table, with Zone Group, Channel Number, Function, Channel Name/Trunked Radio System Talkgroup, Assignment, RX Frequency, RX Tone/NAC, TX Frequency, TX Tone/NAC, Mode, and Remarks.

Block 5 = Special Instructions.

Block 6 = Prepared by (Communications Unit Leader), including Name, Signature, and Date/Time.

Preserve row structure exactly and add continuation pages if channel rows exceed the first page.

ICS 205A mapping rules

Block 1 = Incident Name.

Block 2 = Operational Period.

Block 3 = Basic Local Communications Information table with Incident Assigned Position, Name (Alphabetized), and Method(s) of Contact.

Block 4 = Prepared by, including Name, Position/Title, Signature, and Date/Time.

If the contact list exceeds the first page, continue onto additional ICS 205A pages and repaginate.

Keep in mind this form may contain sensitive contact information.

ICS 206 mapping rules

Block 1 = Incident Name.

Block 2 = Operational Period.

Block 3 = Medical Aid Stations table with Name, Location, Contact Number(s)/Frequency, and Paramedics on Site Yes/No.

Block 4 = Transportation table with Ambulance Service, Location, Contact Number(s)/Frequency, and Level of Service ALS/BLS.

Block 5 = Hospitals table with Hospital Name, Address/Latitude/Longitude if Helipad, Contact Number(s)/Frequency, Travel Time by Air and Ground, Trauma Center Yes and Level, Burn Center Yes/No, and Helipad Yes/No.

Block 6 = Special Medical Emergency Procedures, plus aviation assets checkbox.

Block 7 = Prepared by (Medical Unit Leader), including Name, Signature, and Date/Time.

Block 8 = Approved by (Safety Officer), including Name, Signature, and Date/Time.

If station, transportation, or hospital entries exceed available rows, create continuation pages and repaginate.

ICS 207 mapping rules

Block 1 = Incident Name.

Block 2 = Operational Period.

Block 3 = Organization Chart. Generate a visual chart showing only activated positions.

Populate each organizational box with at least first initial and last name.

Include agency where appropriate, especially for Unified Command.

If there is a shift change during the operational period, list both names separated by a slash.

Add additional pages if more than three branches or more organizational elements are activated.

Block 4 = Prepared by, including Name, Position/Title, Signature, and Date/Time.

Export quality rules

Match each app section to the correct ICS form only.

Validate that every export field is mapped before generating the PDF.

If a required field for a block is missing, show a warning before export instead of placing data in the wrong location.

Keep the output visually aligned with the official FEMA form layout.

Do not truncate repeatable rows silently. Add pages when needed.

Make the export deterministic so the same input always fills the same form blocks the same way.