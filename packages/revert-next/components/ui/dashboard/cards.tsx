'use client';
import { Icons } from '@revertdotdev/icons';
import { AnalyticsSchema } from '@revertdotdev/types/schemas/analyticsSchema';
import { formatNumber } from '@revertdotdev/utils';
type CardProps = {
    title: string;
    value: string;
    children: React.ReactElement;
};

export function CardWrapper({ value }: { value: AnalyticsSchema }) {
    const { totalConnections, totalApiCalls, connectedApps } = value.result;
    return (
        <>
            <Card title="Total Connections" value={formatNumber(totalConnections)}>
                <Icons.connection />
            </Card>
            <Card title="Total Api Requests" value={formatNumber(totalApiCalls)}>
                <Icons.request />
            </Card>
            <Card title="Connected Integrations" value={formatNumber(connectedApps.length)}>
                <Icons.ConnectedApp />
            </Card>
        </>
    );
}

export function Card({ title, value, children }: CardProps) {
    return (
        <div className="rounded-xl p-2 shadow-sm border border-gray-25">
            <div className="flex p-3">
                <div className="bg-shade-800 rounded-xl shadow-sm p-6 my-auto">{children}</div>
                <div className="px-4">
                    <h3 className="text-lg font-semibold mb-1">{title}</h3>
                    <p className={`truncate text-4xl font-bold`}>{value}</p>
                </div>
            </div>
        </div>
    );
}
