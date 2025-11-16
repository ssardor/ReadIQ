import React from 'react'

interface RoleToggleProps {
  role: 'student' | 'mentor'
  onChange: (role: 'student' | 'mentor') => void
}

export const RoleToggle: React.FC<RoleToggleProps> = ({ role, onChange }) => {
  return (
    <div className="flex gap-2 mb-6">
      <button
        type="button"
        onClick={() => onChange('student')}
        className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
          role === 'student'
            ? 'bg-primary-600 text-white shadow-md'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        I am a Student
      </button>
      <button
        type="button"
        onClick={() => onChange('mentor')}
        className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
          role === 'mentor'
            ? 'bg-primary-600 text-white shadow-md'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        I am a Mentor
      </button>
    </div>
  )
}
