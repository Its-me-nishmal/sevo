import forms from '@tailwindcss/forms'

export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-light': '#6366F1',
        'primary-dark': '#818CF8',
        'background-light': '#F8FAFC',
        'background-dark': '#18181B',
        'text-light': '#1F2937',
        'text-dark': '#E4E4E7',
        'secondary-light': '#E2E8F0',
        'secondary-dark': '#3F3F46',
      },
    },
  },
  plugins: [forms],
}
