// Rate limiter middleware
const limits = new Map<string, number[]>()

export function rateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now()
  const requests = limits.get(key) || []
  
  // Remove old requests
  const validRequests = requests.filter(time => now - time < windowMs)
  
  if (validRequests.length >= maxRequests) {
    return false // Rate limit exceeded
  }
  
  validRequests.push(now)
  limits.set(key, validRequests)
  return true
}
