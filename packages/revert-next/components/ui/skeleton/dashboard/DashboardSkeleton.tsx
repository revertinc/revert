import { CardsSkeleton, GraphSkeleton, RecentCallsSkeleton } from '@revertdotdev/components/skeleton/dashboard';
export function DashboardSkeleton() {
    return (
        <>
            <CardsSkeleton />
            <div className="flex justify-between gap-6">
                <GraphSkeleton />
                <RecentCallsSkeleton />
            </div>
        </>
    );
}