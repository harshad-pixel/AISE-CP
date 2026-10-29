import { useMemo } from 'react'

const quadrantStyles = {
  quick_win: { bg: 'bg-green-500', label: 'Quick Wins' },
  strategic: { bg: 'bg-brand-500', label: 'Strategic' },
  fill_in: { bg: 'bg-amber-500', label: 'Fill-ins' },
  time_sink: { bg: 'bg-red-500', label: 'Time Sinks' },
}

function PriorityMatrix({ matrix = [] }) {
  const data = useMemo(() => {
    return matrix.map((item) => ({
      ...item,
      x: item.effort * 10,
      y: item.business_value * 10,
      color: quadrantStyles[item.quadrant] || quadrantStyles.fill_in,
    }))
  }, [matrix])

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 mb-2">Priority Matrix</h3>
        <p className="text-slate-400 text-sm">Run analysis to generate the priority matrix.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
      <h3 className="text-lg font-bold text-slate-800 mb-1">Priority Matrix</h3>
      <p className="text-sm text-slate-400 mb-4">Business Value vs Effort — plotted by requirement</p>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-4 text-xs">
        {Object.entries(quadrantStyles).map(([key, { bg, label }]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-full ${bg}`} />
            <span className="text-slate-600">{label}</span>
          </div>
        ))}
      </div>

      {/* Chart area */}
      <div className="relative w-full" style={{ height: '400px' }}>
        <svg viewBox="0 0 420 400" className="w-full h-full">
          {/* Grid lines */}
          <line x1="210" y1="20" x2="210" y2="380" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="20" y1="200" x2="400" y2="200" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />

          {/* Axes */}
          <line x1="20" y1="380" x2="400" y2="380" stroke="#cbd5e1" strokeWidth="1.5" />
          <line x1="20" y1="20" x2="20" y2="380" stroke="#cbd5e1" strokeWidth="1.5" />

          {/* Axis labels */}
          <text x="210" y="398" textAnchor="middle" className="fill-slate-400 text-xs">Effort →</text>
          <text x="8" y="200" textAnchor="middle" transform="rotate(-90 8 200)" className="fill-slate-400 text-xs">Value →</text>

          {/* Quadrant labels */}
          <text x="115" y="40" textAnchor="middle" className="fill-green-400 text-xs font-medium">Quick Wins</text>
          <text x="305" y="40" textAnchor="middle" className="fill-brand-400 text-xs font-medium">Strategic</text>
          <text x="115" y="370" textAnchor="middle" className="fill-amber-400 text-xs font-medium">Fill-ins</text>
          <text x="305" y="370" textAnchor="middle" className="fill-red-400 text-xs font-medium">Time Sinks</text>

          {/* Data points */}
          {data.map((item, i) => {
            const cx = 20 + (item.x / 100) * 380
            const cy = 380 - (item.y / 100) * 360
            return (
              <g key={i}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={6}
                  className={item.color.bg}
                  stroke="white"
                  strokeWidth="1.5"
                />
                <text x={cx + 9} y={cy + 4} className="fill-slate-500 text-[10px]">
                  #{item.requirement_id}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* Detail list */}
      <div className="mt-4 space-y-1">
        {data.slice(0, 8).map((item) => (
          <div key={item.requirement_id} className="flex items-center gap-2 text-sm">
            <div className={`w-2.5 h-2.5 rounded-full ${item.color.bg}`} />
            <span className="text-slate-600 truncate flex-1">#{item.requirement_id} {item.title}</span>
            <span className="text-slate-400 text-xs">{item.color.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PriorityMatrix
