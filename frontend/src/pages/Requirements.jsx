import { useState, useEffect, useCallback } from 'react'
import { Sparkles, Upload } from 'lucide-react'
import RequirementForm from '../components/RequirementForm.jsx'
import RequirementList from '../components/RequirementList.jsx'
import { projectApi, requirementApi } from '../services/api.js'
import seedData from '../seedData.js'

function Requirements() {
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [requirements, setRequirements] = useState([])
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [analysisMsg, setAnalysisMsg] = useState('')

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

  const fetchRequirements = useCallback(async () => {
    if (!selectedProject) { setLoading(false); return }
    setLoading(true)
    try {
      const res = await requirementApi.list({ project_id: selectedProject })
      setRequirements(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [selectedProject])

  useEffect(() => { fetchProjects() }, [fetchProjects])
  useEffect(() => { fetchRequirements() }, [fetchRequirements])

  const handleDelete = async (id) => {
    try {
      await requirementApi.delete(id)
      fetchRequirements()
    } catch (err) {
      console.error(err)
    }
  }

  const handleAnalyze = async () => {
    if (!selectedProject) return
    setAnalyzing(true)
    setAnalysisMsg('')
    try {
      const res = await requirementApi.prioritize({ project_id: selectedProject })
      await fetchRequirements()
      setAnalysisMsg(`Prioritized ${res.data.summary.total} requirements. Top priority: ${res.data.summary.top_priority?.title || 'N/A'}`)
    } catch (err) {
      setAnalysisMsg('Failed to prioritize: ' + (err.response?.data?.detail || err.message))
    } finally {
      setAnalyzing(false)
    }
  }

  const handleSeed = async () => {
    if (!selectedProject) return
    setSeeding(true)
    setAnalysisMsg('')
    try {
      await requirementApi.bulkCreate({
        project_id: selectedProject,
        requirements: seedData.map((r) => ({ ...r, project_id: selectedProject })),
      })
      await fetchRequirements()
      setAnalysisMsg(`Seeded ${seedData.length} sample requirements.`)
    } catch (err) {
      setAnalysisMsg('Failed to seed: ' + (err.response?.data?.detail || err.message))
    } finally {
      setSeeding(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Requirements</h1>
          <p className="text-slate-500 text-sm mt-1">Add, manage, and prioritize requirements</p>
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
          <button
            onClick={handleSeed}
            disabled={seeding || !selectedProject}
            className="bg-slate-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <Upload size={18} /> {seeding ? 'Seeding...' : 'Seed Sample Data'}
          </button>
          <button
            onClick={handleAnalyze}
            disabled={analyzing || !selectedProject || requirements.length === 0}
            className="bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-brand-700 transition-colors disabled:opacity-50"
          >
            <Sparkles size={18} /> {analyzing ? 'Prioritizing...' : 'Auto-Prioritize'}
          </button>
        </div>
      </div>

      {analysisMsg && (
        <div className="mb-4 bg-brand-50 text-brand-700 text-sm rounded-lg p-3 border border-brand-100">
          {analysisMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <RequirementForm projectId={selectedProject} onCreated={fetchRequirements} />
        </div>
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">
              Requirements ({requirements.length})
            </h2>
          </div>
          <RequirementList requirements={requirements} onDelete={handleDelete} loading={loading} />
        </div>
      </div>
    </div>
  )
}

export default Requirements
