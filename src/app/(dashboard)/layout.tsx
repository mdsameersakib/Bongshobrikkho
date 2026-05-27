import Sidebar from '@/components/Sidebar'
import MobileSidebar from '@/components/MobileSidebar'
import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen bg-background dark:bg-surface-alt overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <MobileSidebar />
        
        <main className="flex-1 overflow-y-auto p-2 md:p-4">
          <div className="max-w-[2000px] mx-auto h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
