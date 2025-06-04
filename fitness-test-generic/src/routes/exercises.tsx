import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/exercises')({
  component: Exercises,
})

function Exercises() {
  return (
    <div className="p-2">
      <h1>Exercises</h1>
      <p>Exercise database without bloated component libraries.</p>
    </div>
  )
}