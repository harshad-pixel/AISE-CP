import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, FileText, FolderKanban, Edit3 } from 'lucide-react'
import { projectApi, requirementApi } from '../services/api.js'

function Projects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ name: '', description: '' })
  const [reqCounts, setReqCounts] = useState({})

  const fetchProjects = useCallback(async () => {
    try {
      const res = await projectApi.list()
      setProjects(res.data)
      // Fetch requirement counts
      const counts = {}
      for (const p of res.data) {
        try {
          const reqsRes = await requirementApi.list({ project_id: p.id })
          counts[p.id] = reqsRes.data.length
        } catch {
          counts[p.id] = 0
        }
      }
      setReqCounts(counts)
    } catch (err) {
      console.error('Failed to fetch projects', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchProjects() }, [fetchProjects])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingId) {
        await projectApi.update(editingId, form)
      } else {
        await projectApi.create(form)
      }
      setForm({ name: '', description: '' })
      setEditingId(null)
      setShowForm(false)
      fetchProjects()
    } catch (err) {
      console.error('Failed to save project', err)
    }
  }

  const handleEdit = (project) => {
    setForm({ name: project.name, description: project.description })
    setEditingId(project.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this project and all its requirements?')) return
    try {
      await projectApi.delete(id)
      fetchProjects()
    } catch (err) {
      console.error('Failed to delete project', err)
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Projects</h1>
          <p className="text-slate-500 text-sm mt-1">Manage requirement projects</p>
        </div>
        <button
          onClick={() => { setForm({ name: '', description: '' }); setEditingId(null); setShowForm(!showForm) }}
          className="bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-brand-700 transition-colors"
        >
          <Plus size={18} /> New Project
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 border border-slate-100 mb-6 space-y-4">
          <h3 className="text-lg font-bold text-slate-800">{editingId ? 'Edit Project' : 'Create Project'}</h3>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              placeholder="Project name..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Project description..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div className="flex gap-3">
            <button type="submit" className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700">
              {editingId ? 'Update' : 'Create'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditingId(null) }} className="text-slate-500 px-4 py-2 rounded-lg hover:bg-slate-100">
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 border border-slate-100 text-center">
          <FolderKanban size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-600 mb-2">No Projects Yet</h3>
          <p className="text-sm text-slate-400">Create a project to start adding requirements.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((project) => (
            <div key={project.id} className="bg-white rounded-xl shadow-sm p-6 border border-slate-100 card-hover">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-800">{project.name}</h3>
                  <p className="text-sm text-slate-500 mt-1">{project.description || 'No description'}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="flex items-center gap-1 text-sm text-slate-400">
                      <FileText size={14} /> {reqCounts[project.id] ?? '—'} requirements
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${project.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {project.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(project)} className="text-slate-400 hover:text-brand-600 p-1">
                    <Edit3 size={18} />
                  </button>
                  <button onClick={() => handleDelete(project.id)} className="text-slate-400 hover:text-red-500 p-1">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Projects
