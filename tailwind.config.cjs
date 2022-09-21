/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{js,ts,jsx,tsx}'],
	theme: {
		extend: {
			fontFamily: {
				heading: ['Poppins', 'sans-serif'],
				body: ['Inter', 'sans-serif'],
			},
			animation: {
				gradient: 'gradient 4s ease-in-out infinite',
				'bounce-delay': 'bounce-delay 4s infinite',
				'ping-delay': 'ping-delay 4s -1.2s cubic-bezier(0, 0, 0.2, 1) infinite',
			},
			keyframes: {
				gradient: {
					'0%': {
						backgroundPosition: '0% 0%',
					},
					'50%': {
						backgroundPosition: '100% 0%',
					},
					'100%': {
						backgroundPosition: '0% 0%',
					},
				},
				'ping-delay': {
					'18.75%, 100%': {
						transform: 'scale(2)',
						opacity: 0,
					},
				},
				'bounce-delay': {
					'75%, 80%, 88.25%, 100%': {
						transform: 'translate3d(0, 0, 0)',
						'animation-timing-function': 'cubic-bezier(0.215, 0.61, 0.355, 1)',
					},
					'85%, 85.75%': {
						transform: 'translate3d(0, -15px, 0) scaleY(1.1)',
						'animation-timing-function':
							'cubic-bezier(0.755, 0.05, 0.855, 0.06)',
					},
					'92.5%': {
						transform: 'translate3d(0, -10px, 0) scaleY(1.05)',
						'animation-timing-function':
							'cubic-bezier(0.755, 0.05, 0.855, 0.06)',
					},
					'95%': {
						transform: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
						'animation-timing-function': 'translate3d(0, 0, 0) scaleY(0.95)',
					},
					'97.5%': {
						transform: 'translate3d(0, -4px, 0) scaleY(1.02)',
					},
				},
			},
		},
	},
	plugins: [
		function ({addVariant}) {
			addVariant('child', '& > *')
			addVariant('child-hover', '& > *:hover')
		},
	],
}
