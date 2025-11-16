import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatRating(rating: number): string {
  return rating.toFixed(1)
}

export function getPositionEmoji(position: string): string {
  const positionEmojis: Record<string, string> = {
    goalkeeper: '🧤',
    defender: '🛡️',
    midfielder: '⚙️',
    forward: '⚡',
    any: '⚽'
  }
  return positionEmojis[position] || '⚽'
}

export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    upcoming: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  }
  return statusColors[status] || 'bg-gray-100 text-gray-800'
}

export function generateAvatarUrl(nickname: string): string {
  return `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(
    `football player cartoon avatar ${nickname} funny playful colorful`
  )}&image_size=square`
}

export function calculateTeamStrength(players: any[]): number {
  if (players.length === 0) return 0
  const totalRating = players.reduce((sum, player) => sum + (player.overall_rating || 0), 0)
  return totalRating / players.length
}

export function getWinRate(wins: number, matchesPlayed: number): string {
  if (matchesPlayed === 0) return '0%'
  return `${Math.round((wins / matchesPlayed) * 100)}%`
}
