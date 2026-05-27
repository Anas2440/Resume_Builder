import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: "local-api-routes",
      configureServer(server) {
        server.middlewares.use("/api/optimize-resume", async (req, res) => {
          const { default: handler } = await import("./api/optimize-resume")
          const apiResponse = {
            status(code: number) {
              res.statusCode = code
              return apiResponse
            },
            json(payload: unknown) {
              res.setHeader("Content-Type", "application/json")
              res.end(JSON.stringify(payload))
            },
            setHeader(name: string, value: string) {
              res.setHeader(name, value)
            }
          }

          await handler(req, apiResponse)
        })
      }
    }
  ],
})
