import { create } from 'zustand'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

interface UIStore {
  sidebarOpen: boolean
  toggleSidebar: () => void
  darkMode: boolean
  toggleDarkMode: () => void
  toasts: Toast[]
  addToast: (message: string, type?: Toast['type']) => void
  removeToast: (id: string) => void
}

function initDarkMode(): boolean {
  try {
    const stored = localStorage.getItem('re_dark_mode')
    const dark = stored !== null ? stored === 'true' : window.matchMedia('(prefers-color-scheme: dark)').matches
    document.documentElement.classList.toggle('dark', dark)
    return dark
  } catch {
    return false
  }
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: false,
  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
  darkMode: initDarkMode(),
  toggleDarkMode: () => set(s => {
    const next = !s.darkMode
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('re_dark_mode', String(next))
    return { darkMode: next }
  }),
  toasts: [],
  addToast: (message, type = 'info') => {
    const id = Date.now().toString()
    set(s => ({ toasts: [...s.toasts, { id, message, type }] }))
    setTimeout(() => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })), 4000)
  },
  removeToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}))
