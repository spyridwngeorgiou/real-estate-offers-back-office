import { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { ToastContainer } from '../ui/Toast'

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
      <ToastContainer />
    </div>
  )
}
