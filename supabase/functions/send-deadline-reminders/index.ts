// @ts-nocheck
// supabase/functions/send-deadline-reminders/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface Assignment {
  reviewer_email: string
  reviewer_name: string
  draft_title: string
  draft_id: number
  deadline: string
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'noreply@yourdomain.com'

serve(async (req) => {
  // Optional: verify secret to prevent unauthorized calls
  const authHeader = req.headers.get('Authorization')
  const expectedSecret = Deno.env.get('CRON_SECRET')
  if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!  // uses service role to bypass RLS
    )

    // Find assignments where:
    // - draft status = pending_review
    // - review_by is within next 24 hours
    // - assignment status = pending (no decision yet)
    const now = new Date()
    const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    const { data: assignments, error } = await supabase
      .from('draft_assignments')
      .select(`
        draft_id,
        status,
        content_drafts!inner (
          title,
          review_by,
          status
        ),
        profiles!reviewer_id (
          email,
          full_name
        )
      `)
      .eq('content_drafts.status', 'pending_review')
      .eq('status', 'pending')
      .lte('content_drafts.review_by', next24h.toISOString())
      .gte('content_drafts.review_by', now.toISOString())

    if (error) throw error

    // Flatten results
    const reminders: Assignment[] = (assignments || [])
      .filter(a => a.content_drafts && a.profiles)
      .map(a => ({
        reviewer_email: a.profiles.email,
        reviewer_name: a.profiles.full_name,
        draft_title: a.content_drafts.title,
        draft_id: a.draft_id,
        deadline: a.content_drafts.review_by
      }))

    if (reminders.length === 0) {
      return new Response(JSON.stringify({ message: 'No reminders to send' }), { status: 200 })
    }

    // Send emails using Resend
    const emailPromises = reminders.map(async (reminder) => {
      const deadlineDate = new Date(reminder.deadline).toLocaleString()
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: reminder.reviewer_email,
          subject: `Reminder: Review "${reminder.draft_title}" by ${deadlineDate}`,
          html: `
            <p>Hello ${reminder.reviewer_name},</p>
            <p>This is a reminder that you have a pending review for:</p>
            <p><strong>${reminder.draft_title}</strong></p>
            <p>Deadline: ${deadlineDate}</p>
            <p>Please log in to Content Flow to complete your review.</p>
            <a href="${Deno.env.get('APP_URL')}/reviewer/pending?draftId=${reminder.draft_id}">
              Review Now
            </a>
          `
        })
      })
      if (!res.ok) {
        console.error(`Failed to send to ${reminder.reviewer_email}`, await res.text())
      }
      return res
    })

    await Promise.all(emailPromises)

    return new Response(JSON.stringify({ sent: reminders.length }), { status: 200 })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})