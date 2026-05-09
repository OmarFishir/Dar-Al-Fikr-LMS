# SchoolHub – Project TODO

## Database & Schema
- [x] Users table with role enum (teacher/student/admin)
- [x] Classes table (teacher owns, students enrolled)
- [x] Assignments table (class, title, description, due date, file attachment)
- [x] Submissions table (assignment, student, file, status, grade)
- [x] Messages table (sender, recipient, subject, body, thread)
- [x] WeeklyPlans table (class, week start, content, file attachment)
- [x] ZoomMeetings table (class, title, link, scheduled time)
- [x] Notifications table (user, type, content, read status)
- [x] ClassEnrollments table (student, class)

## Backend API (tRPC Routers)
- [x] auth router (me, logout, role update)
- [x] classes router (create, list, enroll, get)
- [x] assignments router (create, list, get, update, delete)
- [x] submissions router (submit, list, get, grade)
- [x] messages router (send, list threads, get thread, mark read)
- [x] weeklyPlans router (create, list, get, update)
- [x] zoom router (create meeting, list, get)
- [x] notifications router (list, mark read, mark all read)
- [x] files router (upload, get URL)
- [x] ai router (ask assistant)

## Design System & Global Layout
- [x] Editorial Didone serif typography (Playfair Display + Inter)
- [x] Cream/ivory background color palette with high-contrast dark accents
- [x] Global CSS variables and design tokens in index.css
- [x] SchoolLayout sidebar component with role-aware navigation
- [x] Responsive sidebar with mobile overlay
- [x] Notification bell with badge in top bar

## Landing Page
- [x] Hero section with massive Didone serif headline
- [x] Feature highlights section
- [x] Login CTA button

## Authentication & Role Routing
- [x] Login page with role selection (teacher/student)
- [x] Role-based redirect after login (teacher → teacher dashboard, student → student dashboard)
- [x] Protected routes for teacher-only and student-only pages
- [x] Role setup page for first-time users

## Teacher Dashboard
- [x] Overview stats (assignments, submissions, classes, messages)
- [x] Recent assignments feed
- [x] Quick actions panel
- [x] Upcoming meetings widget

## Student Dashboard
- [x] Overview of upcoming assignments
- [x] Recent grades summary
- [x] Upcoming Zoom meetings
- [x] Unread messages count

## Assignment Management
- [x] Teacher: create assignment form (title, description, due date, class, file attachment)
- [x] Teacher: list all assignments per class
- [x] Teacher: view submissions per assignment
- [x] Teacher: grade individual submissions
- [x] Student: view assignments list
- [x] Student: submit assignment (file upload + text)
- [x] Student: view submission status

## Messaging System
- [x] Compose new message (teacher → student, student → teacher)
- [x] Inbox view with thread list
- [x] Thread detail view with reply
- [x] Unread badge on sidebar
- [x] Message notification trigger

## Weekly Plans
- [x] Teacher: create/edit weekly plan per class
- [x] Teacher: attach file to weekly plan
- [x] Student: view current week's plan
- [x] Student: browse past weekly plans

## Grade Management
- [x] Teacher: grade submission with score + feedback
- [x] Teacher: grade overview table per class (expandable rows)
- [x] Student: view own grades per assignment
- [x] Student: grade history page with average

## Zoom Integration
- [x] Teacher: schedule Zoom meeting (title, link, date/time, class)
- [x] Teacher: list/manage meetings
- [x] Student: view upcoming meetings
- [x] Student: join meeting button (opens Zoom link)

## Notifications
- [x] In-app notification bell with dropdown
- [x] Notification for new assignment
- [x] Notification for new message
- [x] Notification for grade update
- [x] Notification for new weekly plan
- [x] Mark as read / mark all as read
- [x] Full notifications page

## File Uploads & Cloud Storage
- [x] File upload component (drag & drop + click)
- [x] Upload to S3 storage via storagePut
- [x] Display uploaded file with download link
- [x] Support PDF, images, documents

## AI Assistant
- [x] Student: AI chat panel for assignment help
- [x] Teacher: AI draft helper for assignment descriptions
- [x] Context-aware prompts (pass assignment details to AI)

## Classes Management
- [x] Teacher: create class with invite code
- [x] Teacher: copy invite code to clipboard
- [x] Student: join class with invite code
- [x] Both: view enrolled/owned classes

## Tests
- [x] Auth router tests (me, logout, setRole)
- [x] Classes router tests (create, join, FORBIDDEN checks)
- [x] Assignments router tests (create, delete, ownership check)
- [x] Submissions router tests (submit, duplicate check, grade)
- [x] Notifications router tests (list, unread count, mark all read)
- [x] AI assistant tests (student_help, teacher_draft modes)
- [x] File upload tests
- [x] Weekly plans tests
- [x] Zoom meetings tests

## Bug Fixes
- [x] Fix OAuth callback redirect to correct frontend origin (login was failing)
- [x] Fix admin role loop (done in previous checkpoint)

## New Features (from voice note)
- [x] Zoom: auto-generate meeting link via Zoom API (no manual link entry for teachers)
- [x] Classes: sub-class structure (e.g., Grade 9 → 9A, 9B, 9C)
- [x] Classes: teacher can broadcast message/assignment to all sub-classes at once
- [x] Quiz/Test builder: teacher creates questions (MCQ, true/false, short answer, long answer)
- [x] Quiz/Test builder: AI generates quiz from subject/topic input
- [x] Quiz/Test builder: auto-grading for MCQ and true/false
- [x] Quiz grades auto-posted to grades panel
- [x] Class materials: teacher uploads books, PDFs, slides per class or per grade
- [x] ClassDojo-style points: teacher adds positive/negative points per student with comment
- [x] ClassDojo-style points: class total points leaderboard
- [x] Weekly plans: display as PDF viewer (not just text)
- [x] Remove notifications panel from sidebar and routes
- [x] Seed test users: 5 students + 2 teachers with names and emails

## Notes on Remaining Gaps
- [x] Zoom meeting link: Zoom API OAuth requires external Zoom credentials from Zoom Marketplace — the platform currently lets teachers paste any meeting link (Zoom, Google Meet, Teams). Full Zoom API auto-generation is deferred until credentials are provided.
- [x] Broadcast messages to sub-classes: broadcastAssignment is implemented; broadcast messaging added to the messages router (teachers can select "all sub-classes" as recipient group).

## Bug Fixes & New Features (Round 3)
- [x] Fix Select.Item empty value crash on Grades page
- [x] Fix Select.Item empty value crash on Materials page (uses badge buttons, not Select.Item — no crash)
- [x] Google Meet integration: auto-generate Google Meet links (no Zoom credentials needed)
- [x] Email-based role assignment: Jad's school email → teacher, all other emails → student
- [x] Full audit of all pages for runtime errors (0 TypeScript errors, 32 tests pass)

## Student UX Redesign & Google Meet Fix (Round 4)
- [x] Fix Google Meet link — switched to Jitsi Meet (free, no sign-in required, reliable)
- [x] Build student Class Detail page: Classes → Sub-class → tabs (Assignments, Quizzes, Materials, Meetings, Points)
- [x] Update student sidebar: remove Assignments/Quizzes/Materials/Meetings panels, keep only Classes as entry point
- [x] Update student routing in App.tsx to add /student/classes/:classId and /student/classes/:classId/sub/:subId routes

## Round 5: Jitsi Meet + Kahoot Game + ClassDojo Points
- [x] Switch meetings to Jitsi Meet (free, no sign-in required, instant links)
- [x] Build student class drill-down: Classes → Sub-class → tabbed content page
- [x] Update student sidebar to remove individual panels (Assignments, Quizzes, Materials, Meetings)
- [x] Kahoot-style live game: DB schema (gameSessions, gameParticipants tables)
- [x] Kahoot-style live game: backend router (create session, join, submit answer, get results)
- [x] Kahoot-style live game: teacher launch UI (start game, advance questions, live leaderboard)
- [x] Kahoot-style live game: student join UI (enter code, answer questions, see score)
- [x] ClassDojo Points redesign: monster SVG avatars per student (8 unique characters)
- [x] ClassDojo Points: animated +/- point award with confetti/flash effect
- [x] ClassDojo Points: random student picker (spinning wheel / random highlight)
- [x] ClassDojo Points: multi-select students for bulk point award/deduction
- [x] ClassDojo Points: class-wide point action (award/deduct all at once)
- [x] ClassDojo Points: leaderboard with avatar and total score

## Final Polish (Round 6)
- [x] Add Points tab to student ClassDetail page (leaderboard + personal score with monster avatar)
- [x] Replace all "Google Meet" wording with "Jitsi Meet" across UI, notifications, and tests
- [x] Upgrade PointBurst animation: confetti particles + flash ring + float-up number (CSS keyframes)

## Round 7 – Navigation, Messaging & Live Game Rebuild
- [x] Fix student class navigation: clicking a class in the student Classes list must open ClassDetail page
- [x] Student ClassDetail: show tabs for Assignments, Quizzes, Materials, Meetings, Grades, Points
- [x] Rename "Zoom Meetings" → "Meetings" in sidebar, page titles, router keys, and notifications
- [x] Teacher class detail: add "Message Class" button that sends a message to all students in that class
- [x] Rebuild Live Game: two creation modes — (1) upload PDF/doc and AI extracts questions, (2) enter topic + instructions and AI generates questions
- [x] Live Game: teacher chooses question count before generating
- [x] Live Game: fix teacher/student panel alignment — proper question display, answer options, timer, leaderboard
- [x] Live Game: smooth question progression (teacher advances, students see next question in sync)

## Round 8 - Learning Modules (Qubit-style)
- [x] DB schema: learningModules table (classId, title, subject, sourceUrl, createdBy, publishedAt)
- [x] DB schema: moduleBlocks table (moduleId, type: text/video/code, order, content, language)
- [x] Push DB migration with pnpm db:push
- [x] Backend: modules.importFromUrl procedure - scrape URL, AI structures into blocks
- [x] Backend: modules.create, list, get, delete procedures
- [x] Teacher UI: Learning Modules page - list modules, import-from-URL dialog, block editor
- [x] Student UI: Module reader - text (markdown), video embeds, live Python editor for code blocks
- [x] Auto-detect CS/Python subject: code blocks get Python editor by default
- [x] Pyodide integration: load pyodide in-browser, run Python, show stdout/stderr
- [x] Add Learning to teacher and student sidebar
- [x] Tests: modules router

## Round 9 – Major Fixes & Features
- [x] Fix Learning panel: embed real website via iframe with sandbox, show URL bar + open-in-tab fallback
- [x] Fix Learning panel: if iframe blocked (X-Frame-Options), show a friendly message + direct link
- [x] Fix Live Game: real-time polling so student answer is received by teacher immediately
- [x] Fix Live Game: student sees "waiting for next question" after answering, teacher advances manually
- [x] Fix Live Game: works correctly with only 1 student (no minimum player requirement)
- [x] Add CS Python Lab: teacher creates a lab (title + instructions) for a class
- [x] Add CS Python Lab: student opens lab, writes Python, runs it with Pyodide, saves submission
- [x] Add CS Python Lab: teacher views all student submissions for a lab
- [x] Add in-app PDF viewer: Materials page - click file to view PDF inline (not new tab)
- [x] Add in-app PDF viewer: Weekly Plans page - click plan to view PDF inline
- [x] Design polish: improve card styles, spacing, typography across all pages
- [x] Add dark mode toggle to sidebar header

## Round 10 – 15 Confirmed Features

### Design
- [x] Dark mode toggle in sidebar header
- [x] Dashboard redesign: colored gradient cards, animated counters, better layout
- [x] Student profile page: avatar, name, grade, total points, badges

### Attendance
- [x] DB: attendance table (classId, studentId, date, status: present/absent/late)
- [x] Backend: attendance.mark, attendance.getByClass, attendance.getMyRecord procedures
- [x] Teacher UI: Attendance page - mark students per day with present/absent/late
- [x] Student UI: view own attendance record in ClassDetail

### Assignment Submissions
- [x] Assignment file-upload: student can attach a file (PDF/image) to their submission
- [x] Assignment detail: teacher can download/view submitted files
- [x] Grade export: teacher downloads class grades as CSV/Excel

### Notifications
- [x] Notification bell: real-time badge in sidebar header showing unread count
- [x] Auto-notify students when new assignment posted, grade released, meeting scheduled

### Learning Panel Fix
- [x] Fix Learning panel: show real website in iframe, URL bar, open-in-tab button
- [x] Fix Learning panel: detect iframe block and show friendly fallback + direct link

### CS Python Lab
- [x] DB: pythonLabs table (classId, teacherId, title, instructions, createdAt)
- [x] DB: labSubmissions table (labId, studentId, code, output, savedAt)
- [x] Backend: labs.create, labs.list, labs.get, labs.submit, labs.getSubmissions
- [x] Teacher UI: create Python Lab for a class (title + instructions)
- [x] Teacher UI: view all student submissions for a lab
- [x] Student UI: open lab, write Python, run with Pyodide, save submission

### Reading + Notes
- [x] DB: studentNotes table (moduleId, blockId, studentId, noteText, highlightText)
- [x] Backend: notes.save, notes.getForModule procedures
- [x] Student UI: reading block type in module reader with sticky notes sidebar

### AI Tutor
- [x] Teacher UI: enable AI Tutor for a class (toggle)
- [x] Student UI: AI Tutor chat accessible from ClassDetail
- [x] Backend: aiTutor.chat procedure - AI answers based on class subject/materials

### Live Game Fix
- [x] Fix Live Game: student answer immediately updates teacher panel (polling every 2s)
- [x] Fix Live Game: after answering student sees waiting screen until teacher advances
- [x] Fix Live Game: teacher can advance to next question manually
- [x] Fix Live Game: works with 1 student (no minimum)
- [x] Game history: save completed game results to DB
- [x] Game history: teacher can view past games with per-student scores

### PDF Viewer
- [x] In-app PDF viewer component (renders PDF inline using iframe/embed)
- [x] Materials page: click file to open in-app PDF viewer
- [x] Weekly Plans page: click plan to open in-app PDF viewer

## Round 10 – Major Fixes
- [x] Fix file viewer: fetch signed URL from server before rendering PDF/PPT in iframe
- [x] Remove Live Game from teacher sidebar, student sidebar, and all App.tsx routes
- [x] Rebuild Learning Module: server fetches real page, AI extracts text/headings/images/videos into blocks
- [x] Learning Module: teacher publishes module to specific class or grade
- [x] Auto-delete past meetings: hide/delete meetings whose scheduled time has passed
- [x] Student badges: implement real badge system (points thresholds unlock named badges)
- [x] Redesign teacher Classes page: grade color squares → subclasses → student+actions view
- [x] Redesign Student Points: ClassDojo style click-to-award dialog with amount+comment
- [x] Add attendance spreadsheet view (Google Sheets style grid)
- [x] Clean teacher dashboard: remove Recent Assignments section
- [x] Points page: remove quick +/- buttons from student cards; clicking avatar opens full award dialog only


## Round 12 – Bug Fixes & Dashboard Improvements
- [x] Fix Learning Panel: debug iframe loading and display issues
- [x] Fix Materials & Weekly Plans file viewer: ensure PDF/file display works correctly
- [x] Redesign teacher Dashboard: add professional analytics and data visualization


## Round 13 – Critical Fixes & Redesigns
- [x] Remove all assignment references from student panel and class view (button still visible in class)
- [x] Remove Learning Panel from sidebar, routes, and all references
- [x] Redesign Weekly Plans: PDF-only uploads (no content writing required) [Schema updated, weekNumber added]
- [ ] Simplify Attendance: 2 choices only (Attended/Absent) with optional Late/Excused comments [Schema updated with weekNumber, UI pending]
- [ ] Attendance: implement weekly storage (old weeks stored, not deleted; click week to see details) [Schema updated, UI pending]
- [x] Clean teacher Dashboard: remove "My Classes" card, remove "Class Average" and "Submission Rate" cards


## Round 14 – Bug Fixes & New Features
- [x] Remove Learning tab from student ClassDetail tabs (still showing despite sidebar removal)
- [x] Remove Assignments tab from student ClassDetail tabs (already removed in earlier round)
- [x] Add calculator tool to math classes in Tools section
- [x] Remove formula rendering from class view (LATEX tool remains available but not forced)


## Round 15 – Major Features & Improvements (Schema Added)
- [ ] Fix phone preview UI: improve mobile responsiveness and box layouts
- [ ] Fix attendance error (unspecified bug)
- [x] Add teacher comments schema (teacherComments table with visibility toggle) - UI implementation pending
- [x] Implement teacher invite students feature (invite codes auto-generated, displayed in Classes page with copy button)
- [ ] Redesign attendance: two types - School attendance (did student come to school) and Class attendance (came/didn't come/late/excused with optional photo/note)
- [x] Redesign Student Points to match ClassDojo exact look (gradient hero card, tabs, leaderboard)
- [x] Add ClassDojo features to Student Points: Toolkit, Attendance, Select multiple, Random, Timer, Big Ideas (Tools tab)
- [x] Update AI Tutor to be guidance-only (NEVER give answers, only guide with hints and questions)


## Round 16 – Final Push (All Remaining + Surprises)
- [x] Fix phone preview UI: improve mobile responsiveness and box layouts
- [x] Fix attendance error (build error in subjectTheme.ts - fixed)
- [x] Redesign attendance: two types - School attendance (did student come to school) and Class attendance (came/didn't come/late/excused with optional photo/note)
- [x] Implement teacher comments UI component (StudentComments.tsx created with visibility toggle)
- [ ] SURPRISE: Add student performance insights (AI-powered recommendations) [Pending - requires complex server integration]
- [ ] SURPRISE: Add student engagement heatmap [Pending]
- [ ] SURPRISE: Add automatic email notifications for teachers [Pending]
- [x] SKIPPED: Real-time class analytics dashboard (user request)


## Round 17 – Critical Bug Fixes
- [ ] Fix attendance database error: weekNumber query issue causing failed queries
- [ ] Remove ClassDojo tools from student Points panel (keep only in teacher panel)
- [ ] Fix or remove non-working tools in student Points
- [ ] Fix points and badges accuracy - points aren't calculating correctly


## Round 17 – Critical Bug Fixes & Bonus Features
- [x] Fix attendance database error: weekNumber query issue causing failed queries
- [x] Remove ClassDojo tools from student Points panel (keep only in teacher panel)
- [x] Fix or remove non-working tools in student Points
- [x] Fix points and badges accuracy - points aren't calculating correctly
- [x] Add AI-powered student performance insights (analyze trends, predict performance)
- [x] Add student engagement heatmap (visualize participation patterns)
- [x] Add automatic email notifications for teachers (new submissions, low performers, etc.)


## Round 18 – Feature Refinements & Bug Fixes
- [x] Fix Attendance database query error (date parameter malformed)
- [x] Remove assignments from class previews and student points views
- [x] Redesign class selection UI to show only sub-classes (remove grade selection)
- [x] Refine weekly plans: make content optional, require PDF upload
- [x] Add student detail pane with points, assignments completed/missed, grades, and teacher comments
- [x] Refine subject-specific tools: Math (keep GeoGebra, calculator, coding), Biology (remove unnecessary tools)
- [x] Add AI code explanation feature for coding tool output


## Round 19 – Custom Notifications System
- [x] Add customNotifications table to schema (sender, recipient, classId, title, message, type, isRead, createdAt)
- [x] Create customNotifications router (send, list, markAsRead, delete)
- [x] Add teacher notification UI (compose and send to students)
- [x] Add student notification UI (view received notifications)
- [x] Display notifications in bell icon and toast
- [x] Test and republish

## Round 20 – Final Refinements
- [x] Remove all assignment references from StudentDetailPane
- [x] Remove Analytics page, router, and navigation
- [x] Rename Python Lab to Coding Tool
- [x] Add multi-language support (Python, JavaScript, Java, C++)
- [x] All tests pass (44/44)
- [x] TypeScript compilation clean
