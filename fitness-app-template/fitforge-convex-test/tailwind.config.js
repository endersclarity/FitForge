/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}', './index.html'],
  theme: {
    extend: {
      colors: {
        // Fitness-specific color palette
        muscle: {
          primary: '#e53e3e', // Red for primary muscles
          secondary: '#fd9644', // Orange for secondary
          stabilizer: '#38b2ac', // Teal for stabilizers
        },
        intensity: {
          low: '#48bb78', // Green for low intensity
          medium: '#ed8936', // Orange for medium
          high: '#e53e3e', // Red for high intensity
        },
        progress: {
          start: '#4fd1c7',
          middle: '#63b3ed', 
          goal: '#9f7aea',
        }
      },
      animation: {
        'muscle-pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'rep-count': 'bounce 0.3s ease-in-out',
        'set-complete': 'ping 0.5s cubic-bezier(0, 0, 0.2, 1)',
      }
    },
  },
  plugins: [],
}