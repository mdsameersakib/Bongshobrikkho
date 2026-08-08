import { create } from 'zustand'

interface TreeState {
  selectedNodeId: string | null
  setSelectedNodeId: (id: string | null) => void
  isSidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export const useTreeStore = create<TreeState>((set) => ({
  selectedNodeId: null,
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  isSidebarOpen: false,
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
}))
