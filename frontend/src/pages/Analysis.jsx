import { useState, useEffect, useCallback } from 'react'
import { Play, Layers, Lightbulb, BrainCircuit } from 'lucide-react'
import PriorityMatrix from '../components/PriorityMatrix.jsx'
import AnalysisPanel from '../components/AnalysisPanel.jsx'
import { projectApi, analysisApi } from '../services/api.js'

function Analysis() {
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [prioritization, setPrioritization] = useState(null)
  const [running, setRunning] = useState(false)
  const [prioritizing, setPrioritizing] = useState(false)
  const [deep, setDeep] = useState(false)

  const fetchProjects = useCallback(async () => {
    try {
      const res = await projectApi.list()
      setProjects(res.data)
      if (res.data.length > 0 && !selectedProject) {
        setSelectedProject(res.data[0].id)
      }
    } catch (err) {
      console.error(err)
    }
  }, [selectedProject])

  useEffect(() => { fetchProjects() }, [fetchProjects])

  // Reset results when project changes
  useEffect(() => {
    setAnalysis(null)
    setPrioritization(null)
  }, [selectedProject])

  const handleRunAnalysis = async () => {
    if (!selectedProject) return
    setRunning(true)
    setAnalysis(null)
    try {
      const res = await analysisApi.run({
        project_id: selectedProject,
        deep_analysis: deep,
      })
      setAnalysis(res.data)
    } catch (err) {
      console.error('Analysis failed', err)
    } finally {
      setRunning(false)
    }
  }

  const handlePrioritize = async () => {
    if (!selectedProject) return
    setPrioritizing(true)
    setPrioritization(null)
    try {
      const res = await analysisApi.prioritize({
        project_id: selectedProject,
        deep_analysis: true,
      })
      setPrioritization(res.data)
    } catch (err) {
      console.error('Prioritization failed', err)
    } finally {
      setPrioritizing(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">AI Analysis & Prioritization</h1>
          <p className="text-slate-500 text-sm mt-1">Run AI-powered requirement analysis and generate prioritization rankings</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedProject || ''}
            onChange={(e) => setSelectedProject(Number(e.target.value))}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={handleRunAnalysis}
          disabled={running || !selectedProject}
          className="bg-brand-600 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-brand-700 transition-colors disabled:opacity-50"
        >
          <Play size={18} /> {running ? 'Analyzing...' : 'Run AI Analysis'}
        </button>
        <button
          onClick={handlePrioritize}
          disabled={prioritizing || !selectedProject}
          className="bg-slate-800 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-slate-900 transition-colors disabled:opacity-50"
        >
          <Layers size={18} /> {prioritizing ? 'Prioritizing...' : 'Prioritize & Rank'}
        </button>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={deep}
            onChange={(e) => setDeep(e.target.checked)}
            className="accent-brand-600"
          />
          Deep analysis (conflicts & duplicates)
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Analysis results */}
        <div>
          <AnalysisPanel analysis={analysis} loading={running} />
        </div>

        {/* Right: Prioritization + matrix */}
        <div className="space-y-6">
          <PriorityMatrix matrix={prioritization?.matrix || []} />

          {prioritization && (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 mb-1">Prioritization Summary</h3>
              <div className="grid grid-cols-4 gap-3 my-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-brand-600">{prioritization.summary.total}</div>
                  <div className="text-xs text-slate-400">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{prioritization.summary.analyzed}</div>
                  <div className="text-xs text-slate-400">Analyzed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-600">{prioritization.summary.avg_score}</div>
                  <div className="text-xs text-slate-400">Avg Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-500">{prioritization.summary.high_risk_count}</div>
                  <div className="text-xs text-slate-400">High Risk</div>
                </div>
              </div>

              {/* Weighted model */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-slate-600 mb-2">Scoring Weights</h4>
                <div className="space-y-1.5">
                  {Object.entries(prioritization.weights).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 w-28 capitalize">{key.replace('_', ' ')}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-2">
                        <div className="bg-brand-500 h-2 rounded-full" style={{ width: `${val * 100}%` }} />
                      </div>
                      <span className="text-xs font-medium text-slate-600 w-10">{(val * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ranked list */}
              <div>
                <h4 className="text-sm font-medium text-slate-600 mb-2">Ranked Requirements</h4>
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {prioritization.ranked_requirements.map((req) => (
                    <div key={req.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50">
                      <span className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold shrink-0">
                        {req.priority_rank}
                      </span>
                      <span className="text-sm text-slate-600 flex-1 truncate">#{req.id} {req.title}</span>
                      <span className="text-sm font-bold text-brand-600">{req.priority_score}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* RICE scores */}
              {prioritization.ranked_requirements[0]?.rice && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <h4 className="text-sm font-medium text-slate-600 mb-2 flex items-center gap-1">
                    <BrainCircuit size={16} className="text-brand-500" /> RICE Framework
                  </h4>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {prioritization.ranked_requirements.slice(0, 10).map((req) => (
                      <div key={req.id} className="flex items-center gap-2 text-xs">
                        <span className="text-slate-500 flex-1 truncate">#{req.id} {req.title}</span>
                        <span className="text-slate-400">RICE:</span>
                        <span className="font-bold text-slate-700">{req.rice.rice_score}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Recommendations */}
      {prioritization && prioritization.recommendations && (
        <div className="mt-6 bg-gradient-to-br from-brand-50 to-purple-50 rounded-xl p-6 border border-brand-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Lightbulb className="text-brand-500" size={22} /> AI Recommendations
          </h3>
          <div className="space-y-3">
            {prioritization.recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-brand-600 text-white flex items-center justify-center shrink-0 text-sm font-bold">
                  {i + 1}
                </span>
                <p className="text-slate-700 text-sm pt-0.5">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!analysis && !prioritization && !running && (
        <div className="bg-white rounded-xl shadow-sm p-12 border border-slate-100 text-center">
          <BrainCircuit size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-600 mb-2">Ready for Analysis</h3>
          <p className="text-sm text-slate-400">Run AI analysis to assess requirement quality, detect conflicts, and generate prioritization rankings.</p>
        </div>
      )}
    </div>
  )
}

export default Analysis
