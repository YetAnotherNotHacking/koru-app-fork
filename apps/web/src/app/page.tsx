import { ping } from "api-client";
import ClientPing from "@/components/clientPing";
import { getRequestConfig } from "@/lib/auth";

// We need to prevent static generation, since the API is not available at build time
export const dynamic = "force-dynamic";

export default async function Home() {
  const config = await getRequestConfig();
  const { data, error } = await ping({ ...config });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 gap-8 bg-gradient-to-b from-gray-900 to-black">
      <h1 className="text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400 drop-shadow-[0_0_15px_rgba(179,136,255,0.5)]">
        Koru App Test Page
      </h1>

      <div className="bg-black/30 backdrop-blur-md p-6 rounded-lg border border-neutral-800 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
          API Test
        </h2>

        {data && (
          <p className="text-green-400 my-2 drop-shadow-[0_0_8px_rgba(74,222,128,0.4)]">
            {data.message}
          </p>
        )}

        {error && (
          <p className="text-red-400 my-2 drop-shadow-[0_0_8px_rgba(248,113,113,0.4)]">
            Error: {JSON.stringify(error)}
          </p>
        )}

        <div className="mt-6">
          <h3 className="font-medium mb-3 text-indigo-300 drop-shadow-[0_0_8px_rgba(129,140,248,0.4)]">
            Client-side Ping Test:
          </h3>
          <ClientPing />
        </div>
      </div>
    </div>
  );
}
