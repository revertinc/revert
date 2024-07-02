import { Icons } from "@revertdotdev/components/icons";
import { formatNumber } from "@revertdotdev/lib/utils";
type CardProps = {
  title: string;
  value: string;
  children: React.ReactElement;
};

export default function CardWrapper({ value }) {
  return (
    <>
      <Card
        title="Total Connections"
        value={formatNumber(value.totalConnections)}
      >
        <Icons.connection />
      </Card>
      <Card title="Total Api Requests" value={formatNumber(34875)}>
        <Icons.request />
      </Card>
      <Card title="Connected Integrations" value={formatNumber(32343)}>
        <Icons.ConnectedApp />
      </Card>
    </>
  );
}

export function Card({ title, value, children }: CardProps) {
  return (
    <div className="rounded-xl p-2 shadow-sm border border-gray-25">
      <div className="flex p-3">
        <div className="bg-shade-800 rounded-xl shadow-sm p-6 my-auto">
          {children}
        </div>
        <div className="px-4">
          <h3 className="text-lg font-semibold mb-1">{title}</h3>
          <p className={`truncate text-4xl font-bold`}>{value}</p>
        </div>
      </div>
    </div>
  );
}
