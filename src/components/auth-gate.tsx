
'use client';
import { useSession } from 'next-auth/react';
import LoginPage from '@/app/login/page';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { MainSidebar } from '@/components/main-sidebar';
import { Skeleton } from './ui/skeleton';
import { usePathname } from 'next/navigation';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  if (status === 'loading') {
    return (
        <div className="flex h-screen w-screen items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                </div>
            </div>
        </div>
    );
  }

  if (status === 'unauthenticated' && pathname !== '/login') {
    return <LoginPage />;
  }
  
  if (status === 'authenticated' && pathname === '/login') {
    // This can be a redirect to home page in future
    return <div className='flex h-screen w-screen items-center justify-center'><p>Redirecting...</p></div>;
  }

  if (pathname === '/login') {
    return <LoginPage />;
  }

  return (
    <SidebarProvider>
      <MainSidebar />
      <SidebarInset className="p-4 sm:p-6 lg:p-8 bg-background">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
