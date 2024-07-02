import { inter } from "@revertdotdev/components/fonts";

export default function Page() {
  return (
    <div className="relative">
      <div className="w-auto h-44 border border-none rounded-lg bg-gradient-to-br from-accent-500 to-shade-800">
        <div className="absolute ml-8 mt-20">
          <h1
            className={`${inter.className} mb-2 text-xl md:text-2xl font-bold`}
          >
            Welcome to Revert, Nabhag
          </h1>
          <p>
            Complete these following steps to get your integration up and
            running
          </p>
        </div>
      </div>
    </div>
  );
}
