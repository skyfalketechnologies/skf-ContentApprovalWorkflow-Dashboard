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

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- A Supabase account (free tier is fine)

### Usage Guide

### Demo Accounts (password: `test123`)
| Role | Email |
|------|-------|
| Admin | admin@test.com |
| Reviewer | reviewer1@test.com |
| Creator | creator1@test.com |

> New users sign up as Creators. Admins can promote users via the Admin Dashboard.


### Clone the repository
- git clone <your-repository-url>
- cd content-flow

  
### Install project packages
- npm install
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anonymous_key

### Run the development server
npm run dev

### Database Setup Script (SQL)
 -Run this initialization script inside your Supabase SQL Editor to automatically generate the required database tables

-- 1. PROFILES TABLE
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('creator', 'reviewer', 'admin')) DEFAULT 'creator',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CONTENT DRAFTS TABLE
CREATE TABLE content_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('draft', 'pending_review', 'approved', 'changes_requested')) DEFAULT 'draft',
    creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    review_by TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    archived_at TIMESTAMP WITH TIME ZONE,
    content_type TEXT
);

-- 3. DRAFT ASSIGNMENTS TABLE
CREATE TABLE draft_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    draft_id UUID REFERENCES content_drafts(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'changes_requested')) DEFAULT 'pending',
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE
);

-- 4. COMMENTS TABLE
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    draft_id UUID REFERENCES content_drafts(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    decision TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. SYSTEM SETTINGS TABLE
CREATE TABLE system_settings (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- Ensures singleton row
    max_workload INTEGER NOT NULL DEFAULT 10,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert Default Workload Cap Configuration
INSERT INTO system_settings (id, max_workload) VALUES (1, 10) ON CONFLICT DO NOTHING;

