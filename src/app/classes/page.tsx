
'use client';
import { useState, useEffect } from 'react';
import { ClassManager } from "@/components/class-manager";
import { Skeleton } from '@/components/ui/skeleton';
import type { Class } from '@/lib/types';
import { getClasses } from '@/actions/class-actions';

export default function ClassesPage() {
  const [classes, setClasses] = useState<Omit<Class, 'students'>[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchClasses() {
      const fetchedClasses = await getClasses();
      setClasses(fetchedClasses);
      setIsLoading(false);
    }
    fetchClasses();
  }, []);
  
  if (isLoading) {
    return <Skeleton className="h-[400px] w-full" />
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Мои классы</h1>
        <p className="text-muted-foreground">
          Управление классами и учениками
        </p>
      </div>
      <ClassManager initialClasses={classes} onClassesChange={setClasses} />
    </div>
  );
}
