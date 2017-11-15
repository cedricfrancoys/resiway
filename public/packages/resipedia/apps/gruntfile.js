module.exports = function(grunt) {

	grunt.loadNpmTasks('grunt-contrib-cssmin');	
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify'); 
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-clean');
    
	grunt.initConfig({
        clean: {
            options: {
                'force': true
            },            
            all: ['../../../../cache/*']
        },
        
		concat: {
			options: {
				stripBanners: true
			},            
			resipedia_css: {
				src: 'assets/css/resipedia/*.css',
				dest: 'assets/css/resipedia.css'		
			},        
			resipedia_controllers: {
				src: 'src/controllers/*.js',
				dest: 'src/resipedia.controllers.js'
			},            
			resipedia_filters: {
				src: 'src/filters/*.js',
				dest: 'src/resipedia.filters.js'
			},
			resipedia_services: {
				src: 'src/services/*.js',
				dest: 'src/resipedia.services.js'
			},            
			resipedia_all: {
				src: [
                        'src/resipedia.utils.js',                 
                        'src/resipedia.module.js', 
                        'src/resipedia.services.js', 
                        'src/resipedia.routes.js', 
                        'src/resipedia.filters.js', 
                        'src/resipedia.controllers.js'
                    ],
				dest: 'resipedia.js'
			}
			
		},

		cssmin: { 
			bootstrap_css: {
				src: 'assets/css/bootstrap/bootstrap.css',
				dest: 'assets/css/bootstrap.min.css'		
			},

			resipedia_css: {
				src: 'assets/css/resipedia.css',
				dest: 'assets/css/resipedia.min.css'		
			}

		},
        
		uglify: {
		
			options: {
				preserveComments: 'some',
				mangle: true,
				quoteStyle: 3
			},

            dependencies_all: {
                files: [{
                    expand: true,
                    src: 'assets/js/src/*.js',
                    dest: 'assets/js',
                    flatten: true,
                    ext: '.min.js'
                }]
            },
            
			resipedia_all: {
                files: {
                    'resipedia.min.js': ['resipedia.js']
                }
			}
          
		},

			
		watch: {
/*
			scripts: {
				files: dir_scripts+'src/*.js',
				tasks: ['concat', 'uglify', 'jshint']
			},
    
			styles: {
				files: dir_styles+'src/*.css',
				tasks: ['concat']
			}
*/     
		}

	});

	grunt.registerTask('clear-cache', ['clean']);
	grunt.registerTask('compile', ['clean', 'concat', 'cssmin', 'uglify']);
	grunt.registerTask('default', ['clean', 'concat', 'cssmin:resipedia_css', 'uglify:resipedia_all']);
};