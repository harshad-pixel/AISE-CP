import { useState } from 'react'
import { requirementApi } from '../services/api.js'

function RequirementForm({ projectId, onCreated }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'functional',
    type: 'should_have',
    business_value: 5,
    user_impact: 5,
    urgency: 5,
    effort: 5,
    risk: 5,
    tags: '',
    acceptance_criteria: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const categories = [
    { value: 'functional', label: 'Functional' },
    { value: 'non_functional', label: 'Non-Functional' },
    { value: 'technical', label: 'Technical' },
    { value: 'business', label: 'Business' },
    { value: 'constraint', label: 'Constraint' },
  ]

  const moscowTypes = [
    { value: 'must_have', label: 'Must Have' },
    { value: 'should_have', label: 'Should Have' },
    { value: 'could_have', label: 'Could Have' },
    { value: 'wont_have', label: "Won't Have" },
  ]

  const handleChange = (e) => {
    const { name, value, type } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = {
        ...form,
        project_id: projectId,
        tags: form.tags ? form.tags.split(',').map((t) => t.trim()) : [],
      }
      await requirementApi.create(payload)
      setForm({
        title: '', description: '', category: 'functional', type: 'should_have',
        business_value: 5, user_impact: 5, urgency: 5, effort: 5, risk: 5,
        tags: '', acceptance_criteria: '',
      })
      onCreated?.()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create requirement')
    } finally {
      setLoading(false)
    }
  }

  const sliderFields = [
    { name: 'business_value', label: 'Business Value' },
    { name: 'user_impact', label: 'User Impact' },
    { name: 'urgency', label: 'Urgency' },
    { name: 'effort', label: 'Effort' },
    { name: 'risk', label: 'Risk' },
  ]

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 border border-slate-100 space-y-4">
      <h3 className="text-lg font-bold text-slate-800">Add New Requirement</h3>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm rounded-lg p-3">{error}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">Title</label>
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          required
          placeholder="Enter requirement title..."
          className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">Description</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={4}
          placeholder="Describe the requirement in detail..."
          className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Category</label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {categories.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">MoSCoW Priority</label>
          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {moscowTypes.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">Acceptance Criteria</label>
        <textarea
          name="acceptance_criteria"
          value={form.acceptance_criteria}
          onChange={handleChange}
          rows={2}
          placeholder="Given... When... Then..."
          className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">Tags (comma-separated)</label>
        <input
          name="tags"
          value={form.tags}
          onChange={handleChange}
          placeholder="auth, security, login"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* Scoring sliders */}
      <div className="space-y-3">
        {sliderFields.map(({ name, label }) => (
          <div key={name}>
            <label className="flex items-center justify-between text-sm font-medium text-slate-600 mb-1">
              <span>{label}</span>
              <span className="font-bold text-brand-600">{form[name]}/10</span>
            </label>
            <input
              type="range"
              name={name}
              min={0}
              max={10}
              step={0.5}
              value={form[name]}
              onChange={handleChange}
              className="w-full accent-brand-600"
            />
          </div>
        ))}
      </div>

      <button
        type="submit"
        disabled={loading || !projectId}
        className="w-full bg-brand-600 text-white py-2.5 rounded-lg font-medium hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Creating...' : 'Add Requirement'}
      </button>
    </form>
  )
}

export default RequirementForm
