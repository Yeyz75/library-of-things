/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      // Tipografía moderna 2025 - Multi-font stack
      fontFamily: {
        // Display - Para títulos principales (futurista pero legible)
        display: [
          'Cal Sans',
          'Inter Display',
          'Poppins',
          'system-ui',
          'sans-serif',
        ],
        // Sans - Para texto general (más humanizada que Inter)
        sans: [
          'DM Sans',
          'Inter Variable',
          'Helvetica Neue',
          'system-ui',
          'sans-serif',
        ],
        // Mono - Para código y datos técnicos
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'Monaco', 'monospace'],
        // Body - Para párrafos largos (excelente legibilidad)
        body: ['Source Sans Pro', 'Open Sans', 'system-ui', 'sans-serif'],
      },

      // Escala tipográfica perfecta (sistema modular)
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.025em' }],
        sm: ['0.875rem', { lineHeight: '1.5', letterSpacing: '0.01em' }],
        base: ['1rem', { lineHeight: '1.6', letterSpacing: '0' }],
        lg: ['1.125rem', { lineHeight: '1.6', letterSpacing: '-0.01em' }],
        xl: ['1.25rem', { lineHeight: '1.5', letterSpacing: '-0.02em' }],
        '2xl': ['1.5rem', { lineHeight: '1.4', letterSpacing: '-0.025em' }],
        '3xl': ['1.875rem', { lineHeight: '1.3', letterSpacing: '-0.03em' }],
        '4xl': ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.035em' }],
        '5xl': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.04em' }],
        '6xl': ['3.75rem', { lineHeight: '1', letterSpacing: '-0.045em' }],
        '7xl': ['4.5rem', { lineHeight: '1', letterSpacing: '-0.05em' }],
        '8xl': ['6rem', { lineHeight: '1', letterSpacing: '-0.055em' }],
        '9xl': ['8rem', { lineHeight: '1', letterSpacing: '-0.06em' }],
      },

      // Sistema de espaciado basado en múltiplos de 4px (más preciso)
      spacing: {
        0.5: '0.125rem', // 2px
        1: '0.25rem', // 4px
        1.5: '0.375rem', // 6px
        2: '0.5rem', // 8px
        2.5: '0.625rem', // 10px
        3: '0.75rem', // 12px
        3.5: '0.875rem', // 14px
        4: '1rem', // 16px
        5: '1.25rem', // 20px
        6: '1.5rem', // 24px
        7: '1.75rem', // 28px
        8: '2rem', // 32px
        9: '2.25rem', // 36px
        10: '2.5rem', // 40px
        11: '2.75rem', // 44px
        12: '3rem', // 48px
        14: '3.5rem', // 56px
        16: '4rem', // 64px
        18: '4.5rem', // 72px
        20: '5rem', // 80px
        24: '6rem', // 96px
        28: '7rem', // 112px
        32: '8rem', // 128px
        36: '9rem', // 144px
        40: '10rem', // 160px
        44: '11rem', // 176px
        48: '12rem', // 192px
        52: '13rem', // 208px
        56: '14rem', // 224px
        60: '15rem', // 240px
        64: '16rem', // 256px
        72: '18rem', // 288px
        80: '20rem', // 320px
        96: '24rem', // 384px
      },

      // Paleta de colores 2025 - Inspirada en tendencias de diseño actual
      colors: {
        // Primario - Cosmic Purple (tendencia espacial 2025)
        primary: {
          50: '#faf7ff',
          100: '#f3edff',
          200: '#e9dcff',
          300: '#d7bfff',
          400: '#bf98ff',
          500: '#a66eff',
          600: '#944eff',
          700: '#8b37f7',
          800: '#7630db',
          900: '#632bb6',
          950: '#42197c',
        },

        // Secundario - Neo Mint (frescura y modernidad)
        secondary: {
          50: '#f0fdf9',
          100: '#ccfbef',
          200: '#9df5e0',
          300: '#67eace',
          400: '#35d5b8',
          500: '#1abca0',
          600: '#109b85',
          700: '#107c6c',
          800: '#116357',
          900: '#11524a',
          950: '#042f2b',
        },

        // Acento - Electric Blue (tecnología y confianza)
        accent: {
          50: '#eff8ff',
          100: '#dbeeff',
          200: '#bfe2ff',
          300: '#93d0ff',
          400: '#60b4ff',
          500: '#3b95ff',
          600: '#2574ff',
          700: '#1d5fff',
          800: '#1e4fd4',
          900: '#1e45a6',
          950: '#172b65',
        },

        // Neutral - Warm Grays (humanidad y calidez)
        neutral: {
          50: '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d4d1d0',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
          950: '#0f0e0d',
        },

        // Success - Organic Green (sostenibilidad)
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },

        // Warning - Solar Orange (energía y atención)
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },

        // Error - Digital Red (alertas modernas)
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },

        // Info - Cyber Cyan (información y tecnología)
        info: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
          950: '#083344',
        },
      },

      // Bordes redondeados más modernos
      borderRadius: {
        none: '0',
        xs: '0.125rem', // 2px
        sm: '0.25rem', // 4px
        DEFAULT: '0.375rem', // 6px
        md: '0.5rem', // 8px
        lg: '0.75rem', // 12px
        xl: '1rem', // 16px
        '2xl': '1.5rem', // 24px
        '3xl': '2rem', // 32px
        '4xl': '2.5rem', // 40px
        full: '9999px',
      },

      // Sombras más sutiles y modernas
      boxShadow: {
        xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        DEFAULT:
          '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        // Sombras con color para efectos modernos
        primary: '0 4px 14px 0 rgba(166, 110, 255, 0.25)',
        secondary: '0 4px 14px 0 rgba(26, 188, 160, 0.25)',
        accent: '0 4px 14px 0 rgba(59, 149, 255, 0.25)',
        glow: '0 0 20px rgba(166, 110, 255, 0.3)',
        'glow-secondary': '0 0 20px rgba(26, 188, 160, 0.3)',
        'glow-accent': '0 0 20px rgba(59, 149, 255, 0.3)',
      },

      // Animaciones modernas y fluidas
      animation: {
        // Básicas mejoradas
        'fade-in': 'fadeIn 0.4s ease-out',
        'fade-out': 'fadeOut 0.3s ease-in',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-left': 'slideLeft 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-right': 'slideRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-out': 'scaleOut 0.2s ease-in',

        // Modernas 2025
        float: 'float 3s ease-in-out infinite',
        glow: 'glow 2s ease-in-out infinite alternate',
        shimmer: 'shimmer 2s linear infinite',
        wave: 'wave 1.5s ease-in-out infinite',
        'bounce-gentle': 'bounceGentle 2s ease-in-out infinite',
        'rotate-360': 'rotate360 1s linear infinite',
        'pulse-soft': 'pulseSoft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',

        // Efectos para loading
        skeleton: 'skeleton 1.5s ease-in-out infinite',
        dots: 'dots 1.4s ease-in-out infinite',
        spinner: 'spinner 1s linear infinite',

        // Efectos para interacciones
        wiggle: 'wiggle 0.5s ease-in-out',
        shake: 'shake 0.5s ease-in-out',
        heartbeat: 'heartbeat 1s ease-in-out infinite',
      },

      keyframes: {
        // Básicas
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        scaleOut: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.9)', opacity: '0' },
        },

        // Modernas
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(166, 110, 255, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(166, 110, 255, 0.4)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        wave: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(20deg)' },
          '75%': { transform: 'rotate(-15deg)' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        rotate360: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        pulseSoft: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.02)' },
        },

        // Loading
        skeleton: {
          '0%': { backgroundColor: 'rgba(120, 113, 108, 0.1)' },
          '50%': { backgroundColor: 'rgba(120, 113, 108, 0.2)' },
          '100%': { backgroundColor: 'rgba(120, 113, 108, 0.1)' },
        },
        dots: {
          '0%, 20%': { color: 'rgba(120, 113, 108, 0.4)' },
          '50%': { color: 'rgba(120, 113, 108, 1)' },
          '100%': { color: 'rgba(120, 113, 108, 0.4)' },
        },
        spinner: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },

        // Interacciones
        wiggle: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(1deg)' },
          '75%': { transform: 'rotate(-1deg)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-4px)' },
          '75%': { transform: 'translateX(4px)' },
        },
        heartbeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.1)' },
        },
      },

      // Efectos de backdrop para modales modernos
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        DEFAULT: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        '2xl': '40px',
        '3xl': '64px',
      },

      // Transiciones optimizadas
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'bounce-out': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'ease-spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'ease-bounce': 'cubic-bezier(0.68, -0.6, 0.32, 1.6)',
      },

      // Gradientes modernos para 2025
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-cosmic':
          'linear-gradient(135deg, #a66eff 0%, #1abca0 50%, #3b95ff 100%)',
        'gradient-sunset':
          'linear-gradient(135deg, #f59e0b 0%, #ef4444 50%, #a66eff 100%)',
        'gradient-ocean':
          'linear-gradient(135deg, #06b6d4 0%, #3b95ff 50%, #a66eff 100%)',
        'gradient-forest':
          'linear-gradient(135deg, #22c55e 0%, #1abca0 50%, #06b6d4 100%)',
        'gradient-aurora':
          'linear-gradient(135deg, #a66eff 0%, #3b95ff 25%, #1abca0 50%, #22c55e 75%, #f59e0b 100%)',
      },
    },
  },
  plugins: [
    // Plugin personalizado para utilidades adicionales
    function ({ addUtilities, theme }) {
      const newUtilities = {
        // Utilidades de glassmorphism
        '.glass': {
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        },
        '.glass-dark': {
          background: 'rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },

        // Utilidades de neumorphism
        '.neuro': {
          background: theme('colors.neutral.50'),
          boxShadow: '8px 8px 16px #d4d1d0, -8px -8px 16px #ffffff',
        },
        '.neuro-dark': {
          background: theme('colors.neutral.900'),
          boxShadow: '8px 8px 16px #0f0e0d, -8px -8px 16px #292524',
        },

        // Utilidades de hover modernos
        '.hover-lift': {
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: theme('boxShadow.lg'),
          },
        },
        '.hover-glow': {
          transition: 'box-shadow 0.3s ease',
          '&:hover': {
            boxShadow: theme('boxShadow.primary'),
          },
        },

        // Utilidades de focus modernos
        '.focus-ring': {
          '&:focus': {
            outline: 'none',
            ringWidth: '2px',
            ringColor: theme('colors.primary.500'),
            ringOffsetWidth: '2px',
          },
        },
      };

      addUtilities(newUtilities);
    },
  ],
};
