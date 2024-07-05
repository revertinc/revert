export default function RecentCallsSkeleton() {
    return (
        <div className="p-6 w-5/12 bg-gray-25/5 rounded-xl">
            <div className="mb-4 ">
                <h2 className="mb-2 bg-gray-25/5 w-5/12 rounded-lg">&nbsp;</h2>
                <p className="bg-gray-25/5 w-10/12 rounded-lg">&nbsp;</p>
            </div>
            <div className="grid grid-cols-2 bg-gray-25/10 h-80 rounded-xl"></div>
        </div>
    );
}
