import { useState, useEffect, useCallback } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadialBarChart, RadialBar } from 'recharts'
import { FileText, BrainCircuit, AlertTriangle, TrendingUp, FolderKanban } from 'lucide-react'
import StatCard from '../components/StatCard.jsx'
import { projectApi, analysisApi, requirementApi } from '../services/api.js'

const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#6366f1', '#10b981', '#f59e0b', '#ef4444']

function Dashboard() {
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [insights, setInsights] = useState(null)
  const [totalReqs, setTotalReqs] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchProjects = useCallback(async () => {
    try {
      const res = await projectApi.list()
      setProjects(res.data)
      if (res.data.length > 0) {
        setSelectedProject(res.data[0].id)
      }
    } catch (err) {
      console.error('Failed to fetch projects', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchInsights = useCallback(async () => {
    if (!selectedProject) return
    try {
      const [insightsRes, reqsRes] = await Promise.all([
        analysisApi.insights(selectedProject),
        requirementApi.list({ project_id: selectedProject }),
      ])
      setInsights(insightsRes.data)
      setTotalReqs(reqsRes.data.length)
    } catch (err) {
      console.error('Failed to fetch insights', err)
    }
  }, [selectedProject])

  useEffect(() => { fetchProjects() }, [fetchProjects])
  useEffect(() => { fetchInsights() }, [fetchInsights])

  const categoryData = insights
    ? Object.entries(insights.category_distribution).map(([name, value]) => ({ name, value }))
    : []
  const moscowData = insights
    ? Object.entries(insights.moscow_distribution).map(([name, value]) => ({ name, value }))
    : []
  const statusData = insights
    ? Object.entries(insights.status_distribution).map(([name, value]) => ({ name, value }))
    : []

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Overview of requirements, analysis, and prioritization insights</p>
      </div>

      {/* Project selector */}
      <div className="mb-6 flex items-center gap-3">
        <label className="text-sm font-medium text-slate-600">Project:</label>
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

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={FileText} label="Total Requirements" value={insights?.total_requirements ?? '—'} color="brand" />
        <StatCard icon={BrainCircuit} label="Analyzed" value={insights?.analyzed_requirements ?? '—'} subtitle={insights ? `${((insights.analyzed_requirements / (insights.total_requirements || 1)) * 100).toFixed(0)}% coverage` : ''} color="green" />
        <StatCard icon={AlertTriangle} label="High Risk" value={insights?.high_risk_items?.length ?? '—'} color="red" />
        <StatCard icon={TrendingUp} label="Avg Quality" value={insights ? `${insights.avg_quality_score}` : '—'} subtitle="out of 100" color="amber" />
      </div>

      {insights && insights.total_requirements > 0 ? (
        <>
          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Category distribution */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
              <h3 className="text-base font-bold text-slate-800 mb-4">Category Distribution</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 justify-center text-xs mt-2">
                {categoryData.map((entry, i) => (
                  <span key={i} className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    {entry.name}
                  </span>
                ))}
              </div>
            </div>

            {/* MoSCoW distribution */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
              <h3 className="text-base font-bold text-slate-800 mb-4">MoSCoW Prioritization</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={moscowData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Quality gauge */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
              <h3 className="text-base font-bold text-slate-800 mb-4">Quality Metrics</h3>
              <ResponsiveContainer width="100%" height={220}>
                <RadialBarChart innerRadius="30%" outerRadius="100%" data={[
                  { name: 'Quality', value: insights.avg_quality_score, fill: '#10b981' },
                  { name: 'Completeness', value: insights.avg_completeness_score, fill: '#3b82f6' },
                  { name: 'Clarity', value: 100 - insights.avg_ambiguity_score, fill: '#f59e0b' },
                ]}>
                  <RadialBar dataKey="value" cornerRadius={6} />
                  <Tooltip />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="flex justify-around text-xs text-slate-500 mt-2">
                <span>Quality</span>
                <span>Completeness</span>
                <span>Clarity</span>
              </div>
            </div>
          </div>

          {/* Status distribution + recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
              <h3 className="text-base font-bold text-slate-800 mb-4">Status Distribution</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={statusData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" width={80} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
              <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                <TrendingUp size={20} className="text-brand-500" /> AI Recommendations
              </h3>
              <div className="space-y-3">
                {insights.recommendations?.map((rec, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center shrink-0 text-xs font-bold">
                      {i + 1}
                    </span>
                    <p className="text-slate-600">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top priority + high risk */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
              <h3 className="text-base font-bold text-slate-800 mb-4">Top Priority Requirements</h3>
              <div className="space-y-2">
                {insights.high_priority_items?.map((item, i) => (
                  <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                    <span className="text-sm text-slate-600">
                      <span className="font-bold text-brand-600">#{i + 1}</span> {item.title}
                    </span>
                    <span className="text-sm font-bold text-brand-600">{item.priority_score}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
              <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                <AlertTriangle size={18} className="text-red-500" /> High Risk Requirements
              </h3>
              <div className="space-y-2">
                {insights.high_risk_items?.length > 0 ? (
                  insights.high_risk_items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-red-50">
                      <span className="text-sm text-slate-600">{item.title}</span>
                      <span className="text-sm font-bold text-red-500">Risk: {item.risk}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">No high-risk requirements detected.</p>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-12 border border-slate-100 text-center">
          {loading ? (
            <p className="text-slate-400">Loading...</p>
          ) : (
            <>
              <FolderKanban size={48} className="mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-bold text-slate-600 mb-2">No Data Yet</h3>
              <p className="text-sm text-slate-400">Create a project and add requirements to see insights here.</p>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default Dashboard
