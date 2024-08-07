'use client';

import { AreaChart } from '@tremor/react';

const valueFormatter = function (number: number) {
    return new Intl.NumberFormat('us').format(number).toString();
};

export function ApiRequestChart({ value }) {
    const summaryApiCalls = value?.summaryApiCalls;

    return (
        <div className="flex flex-col w-[86.6%] border border-gray-25 rounded-xl p-6 pl-0">
            <div className="mb-5 pl-9">
                <h3 className="text-lg font-semibold mb-1">Total API Requests</h3>
                <p className="text-gray-50/70">
                    Includes outbound requets made to API Providers to retrieve and send data
                </p>
            </div>
            <AreaChart
                className="bg-primary-950"
                data={summaryApiCalls}
                index="date"
                categories={['numberOfCalls']}
                colors={['blue']}
                valueFormatter={valueFormatter}
                showLegend={false}
                showTooltip={false}
            />
        </div>
    );
}