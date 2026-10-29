import { useState } from 'react'
import { requirementApi } from '../services/api.js'
import { Trash2, ChevronDown, ChevronUp, AlertTriangle, CheckCircle } from 'lucide-react'

const categoryColors = {
  functional: 'bg-blue-100 text-blue-700',
  non_functional: 'bg-purple-100 text-purple-700',
  technical: 'bg-indigo-100 text-indigo-700',
  business: 'bg-green-100 text-green-700',
  constraint: 'bg-orange-100 text-orange-700',
}

const moscowColors = {
  must_have: 'bg-red-100 text-red-700',
  should_have: 'bg-amber-100 text-amber-700',
  could_have: 'bg-slate-100 text-slate-700',
  wont_have: 'bg-gray-100 text-gray-500',
}

function scoreColor(score) {
  if (score >= 70) return 'text-green-600'
  if (score >= 40) return 'text-amber-600'
  return 'text-red-600'
}

function RequirementCard({ requirement, onDelete, showAnalysis }) {
  const [expanded, setExpanded] = useState(false)
  const [history, setHistory] = useState(null)
  const [loadingHistory, setLoadingHistory] = useState(false)

  const handleHistory = async () => {
    if (!expanded && !history) {
      setLoadingHistory(true)
      try {
        const res = await requirementApi.get(requirement.id)
        setHistory(res.data)
      } catch {
        /* ignore */
      } finally {
        setLoadingHistory(false)
      }
    }
    setExpanded(!expanded)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 card-hover overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColors[requirement.category] || categoryColors.functional}`}>
                {requirement.category.replace('_', ' ')}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${moscowColors[requirement.type] || moscowColors.should_have}`}>
                {requirement.type.replace('_', ' ')}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600">
                #{requirement.id}
              </span>
              {requirement.priority_rank > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-brand-100 text-brand-700">
                  Rank #{requirement.priority_rank}
                </span>
              )}
            </div>
            <h3 className="font-semibold text-slate-800 text-base mb-1">{requirement.title}</h3>
            <p className="text-sm text-slate-500 line-clamp-2">{requirement.description}</p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className={`text-2xl font-bold ${scoreColor(requirement.priority_score)}`}>
              {requirement.priority_score.toFixed(0)}
            </div>
            <div className="text-xs text-slate-400">priority</div>
          </div>
        </div>

        {/* Score badges */}
        {requirement.quality_score > 0 && (
          <div className="flex flex-wrap gap-4 mt-4 text-sm">
            <div className="flex items-center gap-1">
              {requirement.quality_score >= 60 ? (
                <CheckCircle size={16} className="text-green-500" />
              ) : (
                <AlertTriangle size={16} className="text-amber-500" />
              )}
              <span className="text-slate-600">Quality: <strong>{requirement.quality_score}</strong></span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-slate-600">Ambiguity: <strong className={requirement.ambiguity_score >= 40 ? 'text-red-600' : 'text-slate-700'}>{requirement.ambiguity_score}</strong></span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-slate-600">Completeness: <strong className={requirement.completeness_score < 50 ? 'text-amber-600' : 'text-green-600'}>{requirement.completeness_score}</strong></span>
            </div>
          </div>
        )}

        {/* Tags */}
        {requirement.tags && requirement.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {requirement.tags.map((tag, i) => (
              <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100">
          <button
            onClick={handleHistory}
            className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            Details
          </button>
          <button
            onClick={() => onDelete?.(requirement.id)}
            className="text-sm text-red-500 hover:text-red-600 flex items-center gap-1 ml-auto"
          >
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="bg-slate-50 px-5 py-4 border-t border-slate-100">
          <div className="grid grid-cols-5 gap-4 mb-4">
            {[
              { label: 'Bus. Value', value: requirement.business_value },
              { label: 'User Impact', value: requirement.user_impact },
              { label: 'Urgency', value: requirement.urgency },
              { label: 'Effort', value: requirement.effort },
              { label: 'Risk', value: requirement.risk },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <div className="text-xs text-slate-500 mb-1">{label}</div>
                <div className="w-full bg-slate-200 rounded-full h-2 mb-1">
                  <div className="bg-brand-500 h-2 rounded-full" style={{ width: `${value * 10}%` }} />
                </div>
                <div className="text-xs font-medium text-slate-700">{value}/10</div>
              </div>
            ))}
          </div>
          {requirement.acceptance_criteria && (
            <div className="mt-3">
              <h4 className="text-sm font-medium text-slate-600 mb-1">Acceptance Criteria</h4>
              <p className="text-sm text-slate-500">{requirement.acceptance_criteria}</p>
            </div>
          )}
          {requirement.ai_confidence > 0 && (
            <div className="mt-3 text-xs text-slate-400">
              AI Confidence: {(requirement.ai_confidence * 100).toFixed(0)}% · Status: {requirement.status}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function RequirementList({ requirements, onDelete, loading }) {
  if (loading) {
    return <div className="text-center py-12 text-slate-400">Loading requirements...</div>
  }
  if (!requirements || requirements.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        No requirements yet. Add one to get started.
      </div>
    )
  }
  return (
    <div className="space-y-3">
      {requirements.map((req) => (
        <RequirementCard key={req.id} requirement={req} onDelete={onDelete} />
      ))}
    </div>
  )
}

export default RequirementList
