// Captain payment route handlers
export async function getCaptainEarnings(captainId) {
  // Get captain's total earnings
  return { totalEarnings: 0, pendingPayouts: 0 }
}

export async function requestPayout(captainId, amount) {
  // Request payout to captain's bank account
  return { success: true, payoutId: 'po_123' }
}
