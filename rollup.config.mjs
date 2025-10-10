import terser from '@rollup/plugin-terser';
export default {
    input: 'js/main.js', // entry point
    output: {
      file: 'dist/main.js', // output file
      format: 'cjs', // CommonJS format
      plugins: [
        terser()
      ]
    }
  };