module.exports = {
  presets: [
    '@babel/preset-env',  // Ensure this is included
  ],
  plugins: [
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-transform-private-methods',
    '@babel/plugin-transform-runtime',
  ],
};
