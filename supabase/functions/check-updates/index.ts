import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface VersionInfo {
  version: string;
  download_url: string;
  release_date: string;
}

interface VersionManifest {
  dashboard: VersionInfo;
  pi_collector: VersionInfo;
}

interface UpdateCheckRequest {
  component: string;
  current_version: string;
}

interface UpdateResponse {
  update_available: boolean;
  latest_version?: string;
  download_url?: string;
  message: string;
}

const VERSION_MANIFEST_URL = "https://raw.githubusercontent.com/yourusername/yourrepo/main/versions.json";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const body: UpdateCheckRequest = await req.json();
    const { component, current_version } = body;

    if (!component || !current_version) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: component, current_version",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const versionResponse = await fetch(VERSION_MANIFEST_URL);

    if (!versionResponse.ok) {
      return new Response(
        JSON.stringify({
          update_available: false,
          message: "Unable to check for updates at this time",
        } as UpdateResponse),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const manifest: VersionManifest = await versionResponse.json();
    const componentInfo = manifest[component as keyof VersionManifest];

    if (!componentInfo) {
      return new Response(
        JSON.stringify({
          update_available: false,
          message: "Component not found in version manifest",
        } as UpdateResponse),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const updateAvailable = componentInfo.version !== current_version;

    const result: UpdateResponse = {
      update_available: updateAvailable,
      message: updateAvailable
        ? `Update available: ${componentInfo.version}`
        : "You are running the latest version",
    };

    if (updateAvailable) {
      result.latest_version = componentInfo.version;
      result.download_url = componentInfo.download_url;
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
