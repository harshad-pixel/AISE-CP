import { Lightbulb, AlertTriangle, CheckCircle, TrendingUp, BrainCircuit } from 'lucide-react'

function AnalysisPanel({ analysis, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
        <div className="flex items-center gap-3 mb-4">
          <BrainCircuit className="text-brand-500 animate-pulse" size={24} />
          <h3 className="text-lg font-bold text-slate-800">Running AI Analysis...</h3>
        </div>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-4 bg-slate-100 rounded animate-pulse" style={{ width: `${80 - i * 15}%` }} />
          ))}
        </div>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100 text-center">
        <BrainCircuit size={48} className="mx-auto text-slate-300 mb-3" />
        <h3 className="text-lg font-bold text-slate-700 mb-1">AI Analysis Ready</h3>
        <p className="text-sm text-slate-400">Select a project and run analysis to see results here.</p>
      </div>
    )
  }

  const total = analysis.total_analyzed || 0
  const conflictCount = analysis.conflicts?.length || 0
  const dupCount = analysis.duplicates?.length || 0

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
        <div className="flex items-center gap-3 mb-4">
          <BrainCircuit className="text-brand-500" size={24} />
          <h3 className="text-lg font-bold text-slate-800">Analysis Results</h3>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-brand-600">{total}</div>
            <div className="text-sm text-slate-400">Requirements Analyzed</div>
          </div>
          <div className="text-center">
            <div className={`text-3xl font-bold ${conflictCount > 0 ? 'text-red-500' : 'text-green-500'}`}>{conflictCount}</div>
            <div className="text-sm text-slate-400">Conflicts Found</div>
          </div>
          <div className="text-center">
            <div className={`text-3xl font-bold ${dupCount > 0 ? 'text-amber-500' : 'text-green-500'}`}>{dupCount}</div>
            <div className="text-sm text-slate-400">Potential Duplicates</div>
          </div>
        </div>
      </div>

      {/* Individual analyses */}
      {analysis.analyses && analysis.analyses.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
          <h3 className="text-base font-bold text-slate-800 mb-3">Per-Requirement Breakdown</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {analysis.analyses.map((item) => {
              const a = item.analysis
              return (
                <div key={item.requirement_id} className="border border-slate-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm text-slate-700">#{item.requirement_id} {item.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      a.quality_score >= 60 ? 'bg-green-100 text-green-700' :
                      a.quality_score >= 40 ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      Quality: {a.quality_score}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="text-slate-500">Category: <strong>{a.category}</strong></span>
                    <span className="text-slate-500">MoSCoW: <strong>{a.moscow.replace('_', ' ')}</strong></span>
                    <span className="text-slate-500">Confidence: <strong>{(a.confidence * 100).toFixed(0)}%</strong></span>
                  </div>
                  {a.ambiguous_terms && a.ambiguous_terms.length > 0 && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-amber-600">
                      <AlertTriangle size={12} />
                      Ambiguous: {a.ambiguous_terms.join(', ')}
                    </div>
                  )}
                  {a.missing_aspects && a.missing_aspects.length > 0 && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-red-500">
                      <AlertTriangle size={12} />
                      Missing: {a.missing_aspects.join(', ')}
                    </div>
                  )}
                  {a.urgency_signals && a.urgency_signals.length > 0 && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-red-600">
                      <TrendingUp size={12} />
                      Urgency signals: {a.urgency_signals.join(', ')}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Conflicts */}
      {conflictCount > 0 && (
        <div className="bg-red-50 rounded-xl p-6 border border-red-100">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="text-red-500" size={20} />
            <h3 className="text-base font-bold text-red-700">Detected Conflicts</h3>
          </div>
          <div className="space-y-2">
            {analysis.conflicts.map((c, i) => (
              <div key={i} className="text-sm text-red-600">
                <strong>#{c.requirement_a.id}</strong> vs <strong>#{c.requirement_b.id}</strong>: {c.issue}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Duplicates */}
      {dupCount > 0 && (
        <div className="bg-amber-50 rounded-xl p-6 border border-amber-100">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="text-amber-500" size={20} />
            <h3 className="text-base font-bold text-amber-700">Potential Duplicates</h3>
          </div>
          <div className="space-y-2">
            {analysis.duplicates.map((d, i) => (
              <div key={i} className="text-sm text-amber-600">
                <strong>#{d.requirement_a.id}</strong> & <strong>#{d.requirement_b.id}</strong>: {(d.similarity * 100).toFixed(0)}% similar — {d.recommendation}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No issues message */}
      {conflictCount === 0 && dupCount === 0 && total > 0 && (
        <div className="bg-green-50 rounded-xl p-6 border border-green-100">
          <div className="flex items-center gap-2">
            <CheckCircle className="text-green-500" size={20} />
            <p className="text-sm text-green-600">No conflicts or duplicates detected. Requirements are consistent.</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default AnalysisPanel
