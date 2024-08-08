import { cn } from '@revertdotdev/utils';

//Todo:  later configure shimmer
const shimmer =
    'before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-red-50 before:to-transparent';

function CardSkeleton() {
    return (
        <div className={cn('rounded-xl p-2 shadow-sm  bg-gray-25/5')}>
            <div className="flex p-3">
                <div className="bg-gray-25/10 rounded-xl shadow-sm p-8 md:p-10 my-auto"></div>
                <div className="px-4 mt-2">
                    <div className="mb-4 bg-gray-25/5 w-24 lg:w-40 rounded-lg">&nbsp;</div>
                    <div className="bg-gray-25/5  w-20 lg:w-36 rounded-lg">&nbsp;</div>
                </div>
            </div>
        </div>
    );
}

export function CardsSkeleton() {
    return (
        <div className="grid grid-cols-3 gap-6 mb-8">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
        </div>
    );
}
