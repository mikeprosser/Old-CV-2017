module.exports = function(grunt) {
    grunt.initConfig({
        less: {
            options: {
                paths: ['less'],
                compress: true
            },
            src: {
                expand: true,
                cwd: "less",
                src: "*.less",
                dest: "css",
                ext: ".css"
            }
        },
        watch: {
            less: {
                files: ['less/*.less'],
                tasks: ['less']
            }
        }
    });
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-watch');
};