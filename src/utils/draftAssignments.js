import { supabase } from '../lib/supabaseClient.js'

export async function saveDraftAssignments(draftId, reviewerIds, deadline) {
  if (!draftId) {
    return { success: false, error: 'Missing draft ID.' }
  }

  // Remove duplicates and falsy values
  const uniqueReviewerIds = [...new Set((reviewerIds || []).filter(Boolean))]

  if (uniqueReviewerIds.length > 3) {
    return { success: false, error: 'You can assign a maximum of 3 reviewers.' }
  }

  // Delete existing assignments for this draft
  const { error: deleteError } = await supabase
    .from('draft_assignments')
    .delete()
    .eq('draft_id', draftId)

  if (deleteError) {
    return {
      success: false,
      error: 'Failed to clear existing assignments: ' + deleteError.message
    }
  }

  // Insert new assignments
  if (uniqueReviewerIds.length > 0) {
    const rows = uniqueReviewerIds.map((reviewerId) => ({
      draft_id: draftId,
      reviewer_id: reviewerId,
      status: 'pending'
    }))

    const { error: insertError } = await supabase
      .from('draft_assignments')
      .upsert(rows, { onConflict: 'draft_id,reviewer_id' })

    if (insertError) {
      return {
        success: false,
        error: 'Failed to save reviewer assignments: ' + insertError.message
      }
    }
  }

  // Update draft deadline
  const { error: updateError } = await supabase
    .from('content_drafts')
    .update({
      review_by: deadline || null,
      updated_at: new Date().toISOString()
    })
    .eq('id', draftId)

  if (updateError) {
    return {
      success: false,
      error: 'Failed to update review deadline: ' + updateError.message
    }
  }

  return { success: true }
}