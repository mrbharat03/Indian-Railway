export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return {
    from: (table: string) => ({
      select: async (columns = "*") => {
        const response = await fetch(`${supabaseUrl}/rest/v1/${table}?select=${columns}`, {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        })
        const data = await response.json()
        return { data, error: null }
      },
      insert: async (values: any) => {
        const response = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify(values),
        })
        const data = await response.json()
        return { data, error: null }
      },
    }),
  }
}
