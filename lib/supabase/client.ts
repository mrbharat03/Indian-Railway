interface SupabaseClient {
  auth: {
    signInWithPassword: (credentials: { email: string; password: string }) => Promise<any>
    signUp: (credentials: { email: string; password: string; options?: any }) => Promise<any>
    signOut: () => Promise<any>
    getUser: () => Promise<any>
  }
}

export function createClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return {
    auth: {
      async signInWithPassword({ email, password }) {
        const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseKey,
          },
          body: JSON.stringify({ email, password }),
        })
        return await response.json()
      },

      async signUp({ email, password, options }) {
        const response = await fetch(`${supabaseUrl}/auth/v1/signup`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseKey,
          },
          body: JSON.stringify({
            email,
            password,
            ...(options?.emailRedirectTo && { email_redirect_to: options.emailRedirectTo }),
          }),
        })
        return await response.json()
      },

      async signOut() {
        const token = localStorage.getItem("supabase_token")
        if (token) {
          await fetch(`${supabaseUrl}/auth/v1/logout`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              apikey: supabaseKey,
            },
          })
          localStorage.removeItem("supabase_token")
        }
        return { error: null }
      },

      async getUser() {
        const token = localStorage.getItem("supabase_token")
        if (!token) {
          return { data: { user: null }, error: null }
        }

        const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
          headers: {
            Authorization: `Bearer ${token}`,
            apikey: supabaseKey,
          },
        })

        if (response.ok) {
          const user = await response.json()
          return { data: { user }, error: null }
        } else {
          localStorage.removeItem("supabase_token")
          return { data: { user: null }, error: null }
        }
      },
    },
  }
}
