module.exports = {
  presets: ['babel-preset-expo'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@': './src',
          '@/components': './src/components',
          '@/utils': './src/utils',
          '@/context': './src/context',
          '@/hooks': './src/hooks',
          '@/types': './src/types',
          '@/tests': './tests'
        }
      }
    ]
  ]
};