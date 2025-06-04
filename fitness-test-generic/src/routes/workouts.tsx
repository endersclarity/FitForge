import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { WorkoutSession } from '../components/WorkoutSession'

export const Route = createFileRoute('/workouts')({
  component: Workouts,
})

function Workouts() {
  const [showSession, setShowSession] = useState(false);

  if (showSession) {
    return <WorkoutSession onBack={() => setShowSession(false)} />;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>Workouts</h1>
      <p style={{ marginBottom: '20px' }}>Simple workout tracking without complex dependencies.</p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '400px' }}>
        <button
          onClick={() => setShowSession(true)}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Start New Workout
        </button>
        
        <button
          style={{
            backgroundColor: '#f8f9fa',
            color: '#333',
            border: '1px solid #ddd',
            padding: '12px 24px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          View Workout History
        </button>
      </div>

      <div style={{ marginTop: '40px' }}>
        <h2>Key Differences from FitForge:</h2>
        <ul style={{ marginLeft: '20px' }}>
          <li>No Radix UI components (Button, Card, Input, etc.)</li>
          <li>No React Query - just local state</li>
          <li>No custom hooks architecture</li>
          <li>Plain HTML elements with inline styles</li>
          <li>~25 lines vs ~200+ lines for equivalent functionality</li>
        </ul>
      </div>
    </div>
  )
}