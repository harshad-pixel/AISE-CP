import { NavLink } from 'react-router-dom'
import { LayoutDashboard, FolderKanban, FileText, BrainCircuit } from 'lucide-react'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/requirements', label: 'Requirements', icon: FileText },
  { to: '/analysis', label: 'AI Analysis', icon: BrainCircuit },
]

function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900 text-white flex flex-col z-50">
      {/* Logo / Title */}
      <div className="px-6 py-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand-600 flex items-center justify-center">
            <BrainCircuit size={24} />
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight">AI Requirement</h1>
            <h1 className="text-sm font-bold leading-tight">Analyzer</h1>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
                isActive
                  ? 'bg-brand-600 text-white border-l-4 border-brand-400'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-700 text-xs text-slate-500">
        <p>AI-Powered Requirement</p>
        <p>Analysis & Prioritization</p>
        <p className="mt-2 text-slate-600">v1.0.0</p>
      </div>
    </aside>
  )
}

export default Sidebar
