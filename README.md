# Content Flow

A content approval system that makes review workflows simple, transparent, and efficient.

**Live Demo:** [https://boisterous-fenglisu-001033.netlify.app](https://boisterous-fenglisu-001033.netlify.app)

---

## Overview

Content Flow is a role‑based content approval dashboard built for teams that need a structured way to create, review, and approve content. It eliminates the chaos of email chains and spreadsheets by providing a centralised hub for creators, reviewers, and admins.

### The Problem This Solves

- **No centralised approval system** – teams rely on emails or chat for reviews.
- **Hard to track pending reviews** – creators don’t know who hasn’t reviewed their work.
- **No audit trail** – decisions and comments are lost in inboxes.
- **No oversight** – admins can’t see who is overloaded or how long reviews take.

### How Content Flow Fixes This

- Creators submit drafts for review and track status in real time.
- Reviewers see only what they need to review.
- Admins can manage users, monitor workload, reassign drafts, and view analytics.

---

## Key Features

### For Creators
- Create, edit, and delete drafts.
- Assign up to 3 reviewers with a deadline.
- Submit drafts for review.
- Archive drafts that need rework.
- Real‑time status updates.
- Export approved drafts as `.txt`, `.md`, or copy to clipboard.

### For Reviewers
- View only drafts assigned to you.
- Approve or request changes with a comment.
- See pending, approved, and changes‑requested lists.
- Dashboard with workload stats and recent drafts.

### For Admins
- Analytics dashboard – draft volume, approval time, status distribution, reviewer workload.
- User management – promote or demote creators/reviewers/admins.
- Reviewer management – view performance metrics, suspend/activate reviewers.
- Reassign pending drafts to another reviewer.
- Set a maximum workload cap for reviewers.

### General
- Full authentication (sign up / sign in with role).
- Real‑time updates (Supabase Realtime).
- Audit trail (comments with timestamps and reviewer names).
- Email notifications for pending reviews (deadline reminders).
- PostgreSQL database with Row‑Level Security (RLS).

---

## Tech Stack

- **Frontend:** React 19 + Vite, React Router 7, Recharts
- **Backend & Database:** Supabase (PostgreSQL, RLS, Realtime, Edge Functions)
- **Email:** Resend (via Supabase Edge Functions)
- **State Management:** React hooks + custom hooks (`useAuth`, `useSupabaseRealtime`)
- **Styling:** Plain CSS (no shadows/gradients)

---

## Prerequisites

- Node.js (v18 or later)
- npm or yarn
- A Supabase account (free tier is fine)

---

## Installation & Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/content-flow.git
cd content-flow