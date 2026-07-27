# SP-Tool

Pure JavaScript MIDI Interface for the Roland SP-404 MKII Sampler and Effector.

Use it, test it, improve it:
[SPTOOL on Dev-Zoo](https://sptool.dev-zoo.net)

This is my first open source project so please be kind. I'm still learning a lot and I know there is a lot of room for improvement.

## Requirements

### Rollup 

use " npx rollup --config rollup.config.mjs " to export a single file to /dist

### CSS Sass compile commands:

To compile the final CSS files:

sass css\src\style.scss:css\style.css --style compressed --no-source-map

When working with live uptades during development:

sass --watch css\src\style.scss:css\style.css --no-source-map