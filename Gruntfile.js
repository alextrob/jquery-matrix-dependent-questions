/*
Grunt uses NodeJS to run tasks.
See http://gruntjs.com/getting-started
Also see README for tips and usage.
*/
module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    watch: {
      options: {
        livereload: true
      },
      everything: {
        files: ['**/*.*']
      }
    },
    connect: {
      server: {
        options: {
          port: 9001,
          base: '.'
        }
      }
    },
    open: {
      default_browser: {
        path: 'http://localhost:9001/demo.html'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-open');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('default', ['connect', 'open', 'watch']);
};
