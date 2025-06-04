import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  return (
    <div className="p-2">
      <h1>Fitness Test Generic</h1>
      <p>Testing TanStack Start template for FitForge complexity comparison.</p>
      <div className="mt-4">
        <h2>Key Differences from FitForge:</h2>
        <ul className="list-disc ml-6">
          <li>No Radix UI dependencies (87 fewer packages)</li>
          <li>No Electron/Desktop support</li>
          <li>No backend server integration</li>
          <li>Simple file-based routing</li>
          <li>TypeScript by default</li>
        </ul>
      </div>
    </div>
  )
}