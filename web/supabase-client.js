(function () {
  const TRIP_FOLDER = "smaland-2026";
  const BUCKET = "trip-photos";

  function getConfig() {
    return window.SUPABASE_CONFIG || { url: "", anonKey: "" };
  }

  function isConfigured() {
    const { url, anonKey } = getConfig();
    return Boolean(url && anonKey);
  }

  function getClient() {
    if (!isConfigured()) return null;
    if (!window.supabase?.createClient) {
      throw new Error("Supabase-biblioteket saknas.");
    }
    if (!window.__resaSupabaseClient) {
      const { url, anonKey } = getConfig();
      window.__resaSupabaseClient = window.supabase.createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
          storage: window.localStorage,
        },
      });
    }
    return window.__resaSupabaseClient;
  }

  window.SupabaseClient = {
    TRIP_FOLDER,
    BUCKET,
    isConfigured,
    getClient,
  };
})();
