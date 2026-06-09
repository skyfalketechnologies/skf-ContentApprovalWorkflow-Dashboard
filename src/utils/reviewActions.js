import { supabase } from '../lib/supabaseClient'

export async function submitReviewDecision(draftId, decision, comment) {
  console.log('=== submitReviewDecision called ===')
  console.log('draftId:', draftId)
  console.log('decision:', decision)
  console.log('comment:', comment)

  const trimmedComment = comment?.trim() || ''

  if (!draftId) {
    console.error('No draftId')
    return { success: false, error: 'Draft ID is required.' }
  }

  if (!['approved', 'changes_requested'].includes(decision)) {
    console.error('Invalid decision')
    return { success: false, error: 'Invalid review decision.' }
  }

  if (!trimmedComment) {
    console.error('No comment')
    return { success: false, error: 'Review comment is required.' }
  }

  console.log('Calling RPC with:', { p_draft_id: draftId, p_decision: decision, p_comment: trimmedComment })

  const { data, error } = await supabase.rpc('submit_review_decision', {
    p_draft_id: draftId,
    p_decision: decision,
    p_comment: trimmedComment
  })

  if (error) {
    console.error('RPC error:', error)
    return { success: false, error: error.message }
  }

  console.log('RPC success:', data)
  return {
    success: true,
    data: Array.isArray(data) ? data[0] : data
  }
}