let mix = require('laravel-mix');

mix.js('src/app.js', 'dist/app.js')
  .extract(['alpinejs', 'twitch-js'])
  .postCss(`src/app.css`, 'dist/app.css', [require('tailwindcss')]);

mix.browserSync({
    server: true,
    open: false,
    watch: true
});
