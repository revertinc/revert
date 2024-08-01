export function GraphSkeleton() {
    return (
        <div className="w-[86.6%] bg-gray-25/5 rounded-xl">
            <div className="flex flex-col p-6">
                <div className="mb-5">
                    <h3 className="mb-2 w-4/12 bg-gray-25/5 rounded-lg">&nbsp;</h3>
                    <p className="bg-gray-25/5 rounded-lg w-6/12">&nbsp;</p>
                </div>
                <div className="h-80 bg-gray-25/10 rounded-xl" />
            </div>
        </div>
    );
}
