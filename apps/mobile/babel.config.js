module.exports = {
  presets: ['babel-preset-expo'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@': './src',
          '@coaching-code/domain': '../../packages/domain/src/index.ts'
        }
      }
    ]
  ]
};