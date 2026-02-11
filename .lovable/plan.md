

## HR Document Management System — Implementation Plan

### Phase 1: Authentication & Role-Based Access

- **Login/Signup pages** with clean corporate UI (white + blue theme)
- **Three roles**: Admin, HR, Department user
- **Protected routes** — only authenticated users can access the dashboard
- **Supabase Auth** with email/password signup
- **User roles table** stored separately for security

---

### Phase 2: Candidate Document Submission Form

A public-facing, beautiful form where candidates submit their documents:

- **Fields**: Full Name, Email, Phone, Department (dropdown), Address
- **File uploads**: Photo, Resume, Aadhaar Card, PAN Card, Bank Passbook
- **Validations**: File type (PDF/JPG/PNG), max 5MB, required fields
- **UX**: Upload previews, loading animation on submit, success confirmation
- **Storage**: Files uploaded to Supabase Storage, organized by department/candidate name
- **Database**: Candidate record saved with file URLs and status (Pending by default)

---

### Phase 3: HR Dashboard (Admin Panel)

A professional sidebar-based dashboard with:

- **Sidebar navigation**: Dashboard, All Candidates, Department View, Pending, Verified, Settings
- **Dashboard overview cards**: Total candidates, department-wise counts, recent submissions
- **Candidates table**: Name, Email, Phone, Department, Status, View Details button
- **Table features**: Filter by department, search by name, sort by date
- **Actions**: Update status (Pending → Verified), delete candidate, view uploaded documents
- **Export**: Download candidate data as Excel/CSV

---

### Phase 4: Department Auto-Routing

- Candidates automatically appear under their selected department's view
- Department-specific filtered views in the dashboard
- Storage folders organized as: `documents/{department}/{candidate-name}/`

---

### Phase 5: UI & Design

- **Theme**: Clean corporate white + blue color scheme
- **Components**: Rounded cards, modern table UI, smooth animations
- **Responsive**: Works on mobile and desktop
- **Sidebar layout** with collapsible navigation

---

### Database Structure

- **profiles** — user info (name, email)
- **user_roles** — role assignments (admin / hr / department) — separate table for security
- **candidates** — name, email, phone, department, status, address, created_at
- **candidate_documents** — file references (type, storage URL, candidate ID)

### What's Deferred (not in this plan)

- ❌ Google Drive integration (using Supabase Storage instead)
- ❌ Email automation (skipped for now)
- ❌ Unique upload link generation via email

