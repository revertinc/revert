export function ListRecentCallsSkeleton() {
    return (
        <div className="flex flex-col gap-1">
            {Array.from({ length: 8 }).map(() => (
                <div className="flex justify-between items-center bg-gray-25/10 rounded-md p-2 pb-3">
                    <div className="flex items-center">
                        <div className="px-2.5 py-1 rounded-md bg-gray-25/5 w-12">&nbsp;</div>
                        <p className="ml-2 bg-gray-25/5 w-20 rounded-sm h-4">&nbsp;</p>
                    </div>
                    <div className="bg-gray-25/5 w-3 h-3 rounded-full mr-2"></div>
                </div>
            ))}
        </div>
    );
}
