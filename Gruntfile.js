'use strict';
var mountFolder = function (connect, dir) {
    return connect.static(require('path').resolve(dir));
};


// # Globbing
// for performance reasons we're only matching one level down:
// 'test/spec/{,*/}*.js'
// use this if you want to match all subfolders:
// 'test/spec/**/*.js'





module.exports = function (grunt) {
    // load all grunt tasks
    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);


    // CHANGE THIS !!
    var config = {
        ROOT_URL: 'http://localhost'
    };


    // configurable paths
    var paths = {
        app: 'app',
        dist: 'dist',
        bundle: 'bundle'
    }


    grunt.initConfig({
        paths: paths,
        connect: {
            options: {
                port: 9000,
                // change this to '0.0.0.0' to access the server from outside
                hostname: 'localhost'
            },
            dist: {
                options: {
                    middleware: function (connect) {
                        return [
                            mountFolder(connect, 'dist')
                        ];
                    },
                    keepalive: true
                }
            }
        },
        clean: {
            dist: {
                files: [{
                    dot: true,
                    src: [
                        '.tmp',
                        '<%= paths.dist %>/**/*',
                        '!<%= paths.dist %>{/,**/}.git*',
                        '<%= paths.app %>/*.tar'
                    ]
                }]
            },
            bundle: {
                files: [{
                    dot: true,
                    src: [
                        '<%= paths.bundle %>/**/*'
                    ]
                }]
            },
            server: '.tmp'
        },
        'string-replace': {
            dist: {
                files: [
                    {
                        nonull: true,
                        src: ['<%= paths.bundle %>/programs/client/*.js','<%= paths.bundle %>/programs/client/*.css','<%= paths.bundle %>/programs/client/*.html'],
                        dest: '<%= paths.bundle %>/'
                    }
                ],
                options: {
                    replacements: [{
                        // SETTING THE METEOR RUNTIME VAR (NECESSARY for CLIENT ONLY)
                        pattern: '##RUNTIME_CONFIG##',
                        replacement: '    <script type="text/javascript>">' + "\n" +
'       __meteor_runtime_config__ = {' + "\n" +
'           ROOT_URL: \''+ config.ROOT_URL +'\',' + "\n" +
'           DDP_DEFAULT_CONNECTION_URL: false,' + "\n" +
'           DISABLE_WEBSOCKETS: true' + "\n" +
'       };' + "\n" +
'    </script>'
                    },
                    {
                        pattern: '##HTML_ATTRIBUTES##',
                        replacement: ''
                    },
                    {
                        pattern: /##ROOT_URL_PATH_PREFIX##\/*/g,
                        replacement: ''
                    }]
                }
            }
        },
        shell: {
            bundleMeteor: {
              command: 'meteor bundle bundle.tar',
              options: {
                stdout: true,
                execOptions: {
                    cwd: '<%= paths.app %>'
                }
              },
            },
            extractMeteorBundle: {
              command: 'tar -xvf bundle.tar -C ../',
              options: {
                stdout: true,
                execOptions: {
                    cwd: '<%= paths.app %>'
                }
              },
            }
        },
        copy: {
            dist: {
                files: [{
                    expand: true,
                    dot: true,
                    cwd: '<%= paths.bundle %>/programs/client',
                    dest: '<%= paths.dist %>',
                    src: [
                        '*.js',
                        '*.css',
                        '*.html'
                    ]
                },
                {
                    expand: true,
                    dot: true,
                    cwd: '<%= paths.bundle %>/programs/client/app',
                    dest: '<%= paths.dist %>',
                    src: [
                        '**/*.*'
                    ]
                }
                ]
            }
        },
        rename: {
            main: {
                files: [
                    {src: ['<%= paths.dist %>/app.html'], dest: '<%= paths.dist %>/index.html'},
                ]
            }
        },
    });

    // These task will be processed:
    grunt.registerTask('build', [
        // bundles your meteor app
        'shell:bundleMeteor',

        // extract the bundle.tar to the "bundle/" folder
        'shell:extractMeteorBundle',

        // waits 200ms for certain edge cases where tar isn't quite done
        'sleep',

        // cleans the "dist/" folder and deletes the bundle.tar
        'clean:dist',

        // replaces the placeholders in the index.html with the __meteor_runtime_config__ variable
        'string-replace',

        // copies all the client files to the "dist/"" folder
        'copy',

        // empties the "bundle/" folder
        'clean:bundle',

        // renames the app.html -> index.html
        'rename',

        // starts the server to test your distribution at http://localhost:9000
        'connect:dist'
    ]);

    grunt.registerTask('sleep', function () {
        setTimeout(this.async(), 200);
    });

    grunt.registerTask('default', ['build']);
};
