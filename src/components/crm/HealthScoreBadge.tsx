interface HealthScoreBadgeProps {
  score: number
}

export function HealthScoreBadge({ score }: HealthScoreBadgeProps) {
  let colorClass: string
  let label: string

  if (score >= 80) {
    colorClass = 'bg-green-500 text-white'
    label = 'Excellent'
  } else if (score >= 60) {
    colorClass = 'bg-blue-500 text-white'
    label = 'Good'
  } else if (score >= 40) {
    colorClass = 'bg-yellow-500 text-white'
    label = 'Fair'
  } else if (score >= 20) {
    colorClass = 'bg-orange-500 text-white'
    label = 'At Risk'
  } else {
    colorClass = 'bg-red-500 text-white'
    label = 'Critical'
  }

  return (
    <div className="inline-flex flex-col items-center gap-0.5">
      <div className={`inline-flex items-center justify-center px-2 py-1 text-xs font-semibold rounded ${colorClass}`}>
        {Math.round(score)}
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}
