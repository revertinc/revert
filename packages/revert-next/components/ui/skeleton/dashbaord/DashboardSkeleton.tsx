import { CardsSkeleton } from './CardSkeleton';
import GraphSkeleton from './GraphSkeleton';
import RecentCalls from './RecentCallsSkeleton';

function DashboardSkeleton() {
    return (
        <>
            <CardsSkeleton />
            <div>
                <GraphSkeleton />
                <RecentCalls />
            </div>
        </>
    );
}

export default DashboardSkeleton;
