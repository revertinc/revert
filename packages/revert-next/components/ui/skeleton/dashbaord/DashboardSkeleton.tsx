import { CardsSkeleton } from './CardSkeleton';
import GraphSkeleton from './GraphSkeleton';
import RecentCallsSkeleton from './RecentCallsSkeleton';

function DashboardSkeleton() {
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

export default DashboardSkeleton;
