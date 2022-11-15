let mix = require('laravel-mix');

mix.js('src/app.js', 'dist/')
  .extract(['alpinejs', 'twitch-js'])
  .postCss(`src/app.css`, 'dist/app.css', [require('tailwindcss')])
  .sourceMaps();

mix.browserSync({
    server: true,
    open: false,
    watch: true
});
