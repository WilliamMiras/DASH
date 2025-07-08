export function formatDistanceToNow(date: Date, options?: { addSuffix?: boolean }): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  // Less than a minute ago
  if (diffInSeconds < 60) {
    return options?.addSuffix ? "just now" : "now"
  }

  // Minutes ago
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    const suffix = options?.addSuffix ? " ago" : ""
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? "s" : ""}${suffix}`
  }

  // Hours ago
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    const suffix = options?.addSuffix ? " ago" : ""
    return `${diffInHours} hour${diffInHours !== 1 ? "s" : ""}${suffix}`
  }

  // Days ago
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) {
    const suffix = options?.addSuffix ? " ago" : ""
    return `${diffInDays} day${diffInDays !== 1 ? "s" : ""}${suffix}`
  }

  // Months ago
  const diffInMonths = Math.floor(diffInDays / 30)
  const suffix = options?.addSuffix ? " ago" : ""
  return `${diffInMonths} month${diffInMonths !== 1 ? "s" : ""}${suffix}`
}
