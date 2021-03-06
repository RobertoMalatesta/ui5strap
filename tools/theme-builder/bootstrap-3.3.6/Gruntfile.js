/*!
 * Bootstrap's Gruntfile
 * http://getbootstrap.com
 * Copyright 2013-2015 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 */

module.exports = function (grunt) {
  'use strict';

  // Force use of Unix newlines
  grunt.util.linefeed = '\n';

  RegExp.quote = function (string) {
    return string.replace(/[-\\^$*+?.()|[\]{}]/g, '\\$&');
  };

  var fs = require('fs');
  var path = require('path');
  var npmShrinkwrap = require('npm-shrinkwrap');
  var generateGlyphiconsData = require('./grunt/bs-glyphicons-data-generator.js');
  var BsLessdocParser = require('./grunt/bs-lessdoc-parser.js');
  var getLessVarsData = function () {
    var filePath = path.join(__dirname, 'less/variables.less');
    var fileContent = fs.readFileSync(filePath, { encoding: 'utf8' });
    var parser = new BsLessdocParser(fileContent);
    return { sections: parser.parseFile() };
  };
  var generateRawFiles = require('./grunt/bs-raw-files-generator.js');
  var generateCommonJSModule = require('./grunt/bs-commonjs-generator.js');
  var configBridge = grunt.file.readJSON('./grunt/configBridge.json', { encoding: 'utf8' });

  Object.keys(configBridge.paths).forEach(function (key) {
    configBridge.paths[key].forEach(function (val, i, arr) {
      arr[i] = path.join('./docs/assets', val);
    });
  });
  
  var themeName = grunt.option('ui5strap-theme') || 'ui5strap_default';
  var themeNameSapRef = "sap_bluecrystal";
  
  // Project configuration.
  grunt.initConfig({

    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    banner: '/*!\n' +
            ' * Bootstrap v<%= pkg.version %> (<%= pkg.homepage %>)\n' +
            ' * Copyright 2011-<%= grunt.template.today("yyyy") %> <%= pkg.author %>\n' +
            ' * Licensed under the <%= pkg.license %> license\n' +
            ' */\n',
    themeName : themeName,
    themeNameSapRef : themeNameSapRef,
    jqueryCheck: configBridge.config.jqueryCheck.join('\n'),
    jqueryVersionCheck: configBridge.config.jqueryVersionCheck.join('\n'),

    // Task configuration.
    clean: {
      dist: 'dist',
      docs: 'docs/dist'
    },

    jshint: {
      options: {
        jshintrc: 'js/.jshintrc'
      },
      grunt: {
        options: {
          jshintrc: 'grunt/.jshintrc'
        },
        src: ['Gruntfile.js', 'package.js', 'grunt/*.js']
      },
      core: {
        src: 'js/*.js'
      },
      test: {
        options: {
          jshintrc: 'js/tests/unit/.jshintrc'
        },
        src: 'js/tests/unit/*.js'
      },
      assets: {
        src: ['docs/assets/js/src/*.js', 'docs/assets/js/*.js', '!docs/assets/js/*.min.js']
      }
    },

    jscs: {
      options: {
        config: 'js/.jscsrc'
      },
      grunt: {
        src: '<%= jshint.grunt.src %>'
      },
      core: {
        src: '<%= jshint.core.src %>'
      },
      test: {
        src: '<%= jshint.test.src %>'
      },
      assets: {
        options: {
          requireCamelCaseOrUpperCaseIdentifiers: null
        },
        src: '<%= jshint.assets.src %>'
      }
    },

    concat: {
      options: {
        banner: '<%= banner %>\n<%= jqueryCheck %>\n<%= jqueryVersionCheck %>',
        stripBanners: false
      },
      bootstrap: {
        src: [
          'js/transition.js',
          'js/alert.js',
          'js/button.js',
          'js/carousel.js',
          'js/collapse.js',
          'js/dropdown.js',
          'js/modal.js',
          'js/tooltip.js',
          'js/popover.js',
          'js/scrollspy.js',
          'js/tab.js',
          'js/affix.js'
        ],
        dest: 'dist/js/<%= pkg.name %>.js'
      }
    },

    uglify: {
      options: {
        compress: {
          warnings: false
        },
        mangle: true,
        preserveComments: 'some'
      },
      core: {
        src: '<%= concat.bootstrap.dest %>',
        dest: 'dist/js/<%= pkg.name %>.min.js'
      },
      customize: {
        src: configBridge.paths.customizerJs,
        dest: 'docs/assets/js/customize.min.js'
      },
      docsJs: {
        src: configBridge.paths.docsJs,
        dest: 'docs/assets/js/docs.min.js'
      }
    },

    qunit: {
      options: {
        inject: 'js/tests/unit/phantom.js'
      },
      files: 'js/tests/index.html'
    },

    less: {
      compileCore: {
        options: {
          strictMath: true,
          sourceMap: true,
          outputSourceFiles: true,
          sourceMapURL: '<%= pkg.name %>.css.map',
          sourceMapFilename: 'dist/css/<%= pkg.name %>.css.map'
        },
        src: 'less/bootstrap.less',
        dest: 'dist/css/<%= pkg.name %>.css'
      },
      compileTheme: {
        options: {
          strictMath: true,
          sourceMap: true,
          outputSourceFiles: true,
          sourceMapURL: '<%= pkg.name %>-theme.css.map',
          sourceMapFilename: 'dist/css/<%= pkg.name %>-theme.css.map'
        },
        src: 'less/theme.less',
        dest: 'dist/css/<%= pkg.name %>-theme.css'
      },
      
      /* 
      *-----------------------------
      * START Ui5strap Theme Compile
      *-----------------------------
      */
      
      compileThemeBase: {
        options: {
          strictMath: true,
          sourceMap: true,
          outputSourceFiles: true,
          sourceMapURL: '<%= pkg.name %>.css.map',
          sourceMapFilename: 'dist/css/<%= pkg.name %>.css.map'
        },
        src: '../templates/base/base.less',
        dest: 'dist/css/<%= pkg.name %>.css'
      },
      
      compileThemeCustom: {
        options: {
          strictMath: true,
          sourceMap: true,
          outputSourceFiles: true,
          sourceMapURL: '<%= pkg.name %>.css.map',
          sourceMapFilename: 'dist/css/<%= pkg.name %>.css.map'
        },
        src: '../templates/<%= themeName %>/<%= themeName %>.less',
        dest: 'dist/css/<%= pkg.name %>.css'
      }
      
      /* 
       *-----------------------------
       * END Ui5strap Theme Compile
       *-----------------------------
       */
    },

    autoprefixer: {
      options: {
        browsers: configBridge.config.autoprefixerBrowsers
      },
      core: {
        options: {
          map: true
        },
        src: 'dist/css/<%= pkg.name %>.css'
      },
      theme: {
        options: {
          map: true
        },
        src: 'dist/css/<%= pkg.name %>-theme.css'
      },
      docs: {
        src: ['docs/assets/css/src/docs.css']
      },
      examples: {
        expand: true,
        cwd: 'docs/examples/',
        src: ['**/*.css'],
        dest: 'docs/examples/'
      }
    },

    csslint: {
      options: {
        csslintrc: 'less/.csslintrc'
      },
      dist: [
        'dist/css/bootstrap.css',
        'dist/css/bootstrap-theme.css'
      ],
      examples: [
        'docs/examples/**/*.css'
      ],
      docs: {
        options: {
          ids: false,
          'overqualified-elements': false
        },
        src: 'docs/assets/css/src/docs.css'
      }
    },

    cssmin: {
      options: {
        // TODO: disable `zeroUnits` optimization once clean-css 3.2 is released
        //    and then simplify the fix for https://github.com/twbs/bootstrap/issues/14837 accordingly
        compatibility: 'ie8',
        keepSpecialComments: '*',
        sourceMap: true,
        advanced: false
      },
      minifyCore: {
        src: 'dist/css/<%= pkg.name %>.css',
        dest: 'dist/css/<%= pkg.name %>.min.css'
      },
      minifyTheme: {
        src: 'dist/css/<%= pkg.name %>-theme.css',
        dest: 'dist/css/<%= pkg.name %>-theme.min.css'
      },
      docs: {
        src: [
          'docs/assets/css/ie10-viewport-bug-workaround.css',
          'docs/assets/css/src/pygments-manni.css',
          'docs/assets/css/src/docs.css'
        ],
        dest: 'docs/assets/css/docs.min.css'
      }
    },

    csscomb: {
      options: {
        config: 'less/.csscomb.json'
      },
      dist: {
        expand: true,
        cwd: 'dist/css/',
        src: ['*.css', '!*.min.css'],
        dest: 'dist/css/'
      },
      examples: {
        expand: true,
        cwd: 'docs/examples/',
        src: '**/*.css',
        dest: 'docs/examples/'
      },
      docs: {
        src: 'docs/assets/css/src/docs.css',
        dest: 'docs/assets/css/src/docs.css'
      }
    },

    copy: {
      fonts: {
        expand: true,
        src: 'fonts/*',
        dest: 'dist/'
      },
      docs: {
        expand: true,
        cwd: 'dist/',
        src: [
          '**/*'
        ],
        dest: 'docs/dist/'
      },
      
           
      /*
      * ------------------------- 
      * START Ui5strap Theme Copy
      * -------------------------
      */
      
      //Base Theme
      //Copy minified bootstrap css nach base library.css
      copyThemeBaseCssLibrary: {
        src : 'dist/css/<%= pkg.name %>.min.css',
        dest : '<%= pkg.ui5strap.tgtDirLibraryThemes %>base/library.css'
      },
      //Copy unminified bootstrap css nacch base library-dbg.css
      copyThemeBaseCssLibraryDebug: {
        src : 'dist/css/<%= pkg.name %>.css',
        dest : '<%= pkg.ui5strap.tgtDirLibraryThemes %>base/library-dbg.css'
      },
      //Copy bootstrap fonts
      copyThemeBaseBootstrapFonts: {
        expand: true,
        cwd : 'fonts/',
        src : ['*'],
        dest : '<%= pkg.ui5strap.tgtDirLibraryThemes %>base/fonts/'
      },
      //Copy font awesome fonts
      copyThemeBaseFontAwesomeFonts: {
        expand : true,
        cwd : '<%= pkg.ui5strap.srcDirFontAwesomeFonts %>',
        src : ['*'],
        dest : '<%= pkg.ui5strap.tgtDirLibraryThemes %>base/fonts/'
      },
      //Copy font awesome fonts
      copyThemeBaseFlagIconCssImg: {
        expand : true,
        cwd : '<%= pkg.ui5strap.srcDirFlagIconCssImg %>',
        src : ['**'],
        dest : '<%= pkg.ui5strap.tgtDirLibraryThemes %>base/img/flags/'
      },
      
      //------------------------------------
      //------------------------------------
      //Custom Theme
      //Minified library
      copyThemeCustomCssLibrary: {
        src : 'dist/css/<%= pkg.name %>.min.css',
        dest : '<%= pkg.ui5strap.tgtDirCustomThemes %><%= themeName %>/library.css'
      },
      //Unminified library
      copyThemeCustomCssLibraryDebug: {
        src : 'dist/css/<%= pkg.name %>.css',
        dest : '<%= pkg.ui5strap.tgtDirCustomThemes %><%= themeName %>/library-dbg.css'
      },
      //Copy bootstrap fonts
      copyThemeCustomBootstrapFonts: {
        expand: true,
        cwd : 'fonts/',
        src : ['*'],
        dest : '<%= pkg.ui5strap.tgtDirCustomThemes %><%= themeName %>/fonts/'
      },
      //Copy font awesome fonts
      copyThemeCustomFontAwesomeFonts: {
        expand : true,
        cwd : '<%= pkg.ui5strap.srcDirFontAwesomeFonts %>',
        src : ['*'],
        dest : '<%= pkg.ui5strap.tgtDirCustomThemes %><%= themeName %>/fonts/'
      },
      //Copy font awesome fonts
      copyThemeCustomFlagIconCssImg: {
        expand : true,
        cwd : '<%= pkg.ui5strap.srcDirFlagIconCssImg %>',
        src : ['**'],
        dest : '<%= pkg.ui5strap.tgtDirCustomThemes %><%= themeName %>/img/flags/'
      },
      //Copy custom fonts
      copyThemeCustomMyFonts: {
        expand: true,
        cwd : '<%= pkg.ui5strap.srcDirTemplates %><%= themeName %>/fonts/',
        src : ['*'],
        dest : '<%= pkg.ui5strap.tgtDirCustomThemes %><%= themeName %>/fonts/'
      },
      //Copy custom images
      copyThemeCustomMyImages: {
        expand: true,
        cwd : '<%= pkg.ui5strap.srcDirTemplates %><%= themeName %>/img/',
        src : ['*'],
        dest : '<%= pkg.ui5strap.tgtDirCustomThemes %><%= themeName %>/img/'
      },
      
      //SAP => Ui5Strap
      //Provide sap.ui.core, sap.ui.commons, sap.ui.layout, sap.m support within Ui5Strap theme
      //Copy custom images
      copyThemeCustomSapUiCoreSupport: {
        expand: true,
        cwd : '<%= pkg.ui5strap.srcDirSapThemes %>ui/core/themes/<%= themeNameSapRef %>/',
        src : ['*'],
        dest : '<%= pkg.ui5strap.tgtDirCustomSapThemes %>ui/core/themes/<%= themeName %>/'
      },
      copyThemeCustomSapUiCommonsSupport: {
          expand: true,
          cwd : '<%= pkg.ui5strap.srcDirSapThemes %>ui/commons/themes/<%= themeNameSapRef %>/',
          src : ['*'],
          dest : '<%= pkg.ui5strap.tgtDirCustomSapThemes %>ui/commons/themes/<%= themeName %>/'
      },
      copyThemeCustomSapUiLayoutSupport: {
          expand: true,
          cwd : '<%= pkg.ui5strap.srcDirSapThemes %>ui/layout/themes/<%= themeNameSapRef %>/',
          src : ['*'],
          dest : '<%= pkg.ui5strap.tgtDirCustomSapThemes %>ui/layout/themes/<%= themeName %>/'
      },
      copyThemeCustomSapMSupport: {
          expand: true,
          cwd : '<%= pkg.ui5strap.srcDirSapThemes %>m/themes/<%= themeNameSapRef %>/',
          src : ['*'],
          dest : '<%= pkg.ui5strap.tgtDirCustomSapThemes %>m/themes/<%= themeName %>/'
      },
      
      //---------------------------------
      //---------------------------------
      //Ui5Strap => SAP
      //Provide also style for sap theme "blue_crystal"
      //Minified library
      copyThemeCustomSapCssLibrary: {
        src : 'dist/css/<%= pkg.name %>.min.css',
        dest : '<%= pkg.ui5strap.tgtDirLibraryThemes %><%= themeNameSapRef %>/library.css'
      },
      //Unminified library
      copyThemeCustomSapCssLibraryDebug: {
        src : 'dist/css/<%= pkg.name %>.css',
        dest : '<%= pkg.ui5strap.tgtDirLibraryThemes %><%= themeNameSapRef %>/library-dbg.css'
      },
      //Copy bootstrap fonts
      copyThemeCustomSapBootstrapFonts: {
        expand: true,
        cwd : 'fonts/',
        src : ['*'],
        dest : '<%= pkg.ui5strap.tgtDirLibraryThemes %><%= themeNameSapRef %>/fonts/'
      },
      //Copy font awesome fonts
      copyThemeCustomSapFontAwesomeFonts: {
        expand : true,
        cwd : '<%= pkg.ui5strap.srcDirFontAwesomeFonts %>',
        src : ['*'],
        dest : '<%= pkg.ui5strap.tgtDirLibraryThemes %><%= themeNameSapRef %>/fonts/'
      },
      //Copy font awesome fonts
      copyThemeCustomSapFlagIconCssImg: {
        expand : true,
        cwd : '<%= pkg.ui5strap.srcDirFlagIconCssImg %>',
        src : ['**'],
        dest : '<%= pkg.ui5strap.tgtDirLibraryThemes %><%= themeNameSapRef %>/img/flags/'
      },
      //Copy custom fonts
      copyThemeCustomSapMyFonts: {
        expand: true,
        cwd : '<%= pkg.ui5strap.srcDirTemplates %><%= themeName %>/fonts/',
        src : ['*'],
        dest : '<%= pkg.ui5strap.tgtDirLibraryThemes %><%= themeNameSapRef %>/fonts/'
      },
      //Copy custom images
      copyThemeCustomSapMyImages: {
        expand: true,
        cwd : '<%= pkg.ui5strap.srcDirTemplates %><%= themeName %>/img/',
        src : ['*'],
        dest : '<%= pkg.ui5strap.tgtDirLibraryThemes %><%= themeNameSapRef %>/img/'
      }
      /*
      * -----------------------
      * END Ui5strap Theme Copy
      * -----------------------
      */
    },

    connect: {
      server: {
        options: {
          port: 3000,
          base: '.'
        }
      }
    },

    jekyll: {
      options: {
        config: '_config.yml'
      },
      docs: {},
      github: {
        options: {
          raw: 'github: true'
        }
      }
    },

    htmlmin: {
      dist: {
        options: {
          collapseWhitespace: true,
          conservativeCollapse: true,
          minifyCSS: true,
          minifyJS: true,
          removeAttributeQuotes: true,
          removeComments: true
        },
        expand: true,
        cwd: '_gh_pages',
        dest: '_gh_pages',
        src: [
          '**/*.html',
          '!examples/**/*.html'
        ]
      }
    },

    jade: {
      options: {
        pretty: true,
        data: getLessVarsData
      },
      customizerVars: {
        src: 'docs/_jade/customizer-variables.jade',
        dest: 'docs/_includes/customizer-variables.html'
      },
      customizerNav: {
        src: 'docs/_jade/customizer-nav.jade',
        dest: 'docs/_includes/nav/customize.html'
      }
    },

    htmllint: {
      options: {
        ignore: [
          'Attribute "autocomplete" not allowed on element "button" at this point.',
          'Attribute "autocomplete" is only allowed when the input type is "color", "date", "datetime", "datetime-local", "email", "month", "number", "password", "range", "search", "tel", "text", "time", "url", or "week".',
          'Element "img" is missing required attribute "src".'
        ]
      },
      src: '_gh_pages/**/*.html'
    },

    watch: {
      src: {
        files: '<%= jshint.core.src %>',
        tasks: ['jshint:core', 'qunit', 'concat']
      },
      test: {
        files: '<%= jshint.test.src %>',
        tasks: ['jshint:test', 'qunit']
      },
      less: {
        files: 'less/**/*.less',
        tasks: 'less'
      }
    },

    sed: {
      versionNumber: {
        pattern: (function () {
          var old = grunt.option('oldver');
          return old ? RegExp.quote(old) : old;
        })(),
        replacement: grunt.option('newver'),
        exclude: [
          'dist/fonts',
          'docs/assets',
          'fonts',
          'js/tests/vendor',
          'node_modules',
          'test-infra'
        ],
        recursive: true
      }
    },

    'saucelabs-qunit': {
      all: {
        options: {
          build: process.env.TRAVIS_JOB_ID,
          throttled: 10,
          maxRetries: 3,
          maxPollRetries: 4,
          urls: ['http://127.0.0.1:3000/js/tests/index.html?hidepassed'],
          browsers: grunt.file.readYAML('grunt/sauce_browsers.yml')
        }
      }
    },

    exec: {
      npmUpdate: {
        command: 'npm update'
      }
    },

    compress: {
      main: {
        options: {
          archive: 'bootstrap-<%= pkg.version %>-dist.zip',
          mode: 'zip',
          level: 9,
          pretty: true
        },
        files: [
          {
            expand: true,
            cwd: 'dist/',
            src: ['**'],
            dest: 'bootstrap-<%= pkg.version %>-dist'
          }
        ]
      }
    }

  });


  // These plugins provide necessary tasks.
  require('load-grunt-tasks')(grunt, { scope: 'devDependencies' });
  require('time-grunt')(grunt);

  // Docs HTML validation task
  grunt.registerTask('validate-html', ['jekyll:docs', 'htmllint']);

  var runSubset = function (subset) {
    return !process.env.TWBS_TEST || process.env.TWBS_TEST === subset;
  };
  var isUndefOrNonZero = function (val) {
    return val === undefined || val !== '0';
  };

  // Test task.
  var testSubtasks = [];
  // Skip core tests if running a different subset of the test suite
  if (runSubset('core') &&
      // Skip core tests if this is a Savage build
      process.env.TRAVIS_REPO_SLUG !== 'twbs-savage/bootstrap') {
    testSubtasks = testSubtasks.concat(['dist-css', 'dist-js', 'csslint:dist', 'test-js', 'docs']);
  }
  // Skip HTML validation if running a different subset of the test suite
  if (runSubset('validate-html') &&
      // Skip HTML5 validator on Travis when [skip validator] is in the commit message
      isUndefOrNonZero(process.env.TWBS_DO_VALIDATOR)) {
    testSubtasks.push('validate-html');
  }
  // Only run Sauce Labs tests if there's a Sauce access key
  if (typeof process.env.SAUCE_ACCESS_KEY !== 'undefined' &&
      // Skip Sauce if running a different subset of the test suite
      runSubset('sauce-js-unit') &&
      // Skip Sauce on Travis when [skip sauce] is in the commit message
      isUndefOrNonZero(process.env.TWBS_DO_SAUCE)) {
    testSubtasks.push('connect');
    testSubtasks.push('saucelabs-qunit');
  }
  grunt.registerTask('test', testSubtasks);
  grunt.registerTask('test-js', ['jshint:core', 'jshint:test', 'jshint:grunt', 'jscs:core', 'jscs:test', 'jscs:grunt', 'qunit']);

  // JS distribution task.
  grunt.registerTask('dist-js', ['concat', 'uglify:core', 'commonjs']);

  // CSS distribution task.
  grunt.registerTask('less-compile', ['less:compileCore', 'less:compileTheme']);
  grunt.registerTask('dist-css', ['less-compile', 'autoprefixer:core', 'autoprefixer:theme', 'csscomb:dist', 'cssmin:minifyCore', 'cssmin:minifyTheme']);

  // Full distribution task.
  grunt.registerTask('dist', ['clean:dist', 'dist-css', 'copy:fonts', 'dist-js']);

/*
  * ----------------------------
  * START Ui5Strap Theme Builder
  * ----------------------------
  */

  //Task used in all build-theme-* tasks
  grunt.registerTask(
	'build-theme-bs', 
	[
	 		'autoprefixer:core', 'csscomb:dist', 'cssmin:minifyCore', 
	 		'cssmin:minifyTheme', 'copy:fonts'
	]
  );

  //Build Base Theme
  //The Base Theme should look like the default bootstrap theme
  grunt.registerTask(
	'build-theme-base', 
	[
	 		'clean:dist', 'less:compileThemeBase', 'build-theme-bs', 
	 		'copy:copyThemeBaseBootstrapFonts', 'copy:copyThemeBaseFontAwesomeFonts',
	 		'copy:copyThemeBaseCssLibrary', 'copy:copyThemeBaseCssLibraryDebug',
	 		
	 		'copy:copyThemeBaseFlagIconCssImg'
	]
  );
  
  //Build Custom Theme
  grunt.registerTask(
	'build-theme-custom', 
	[
		   'clean:dist', 'less:compileThemeCustom', 'build-theme-bs', 
		   'copy:copyThemeCustomBootstrapFonts', 'copy:copyThemeCustomFontAwesomeFonts', 
		   'copy:copyThemeCustomMyFonts', 'copy:copyThemeCustomMyImages', 
		   'copy:copyThemeCustomCssLibrary', 'copy:copyThemeCustomCssLibraryDebug', 
		   'copy:copyThemeCustomSapUiCoreSupport', 'copy:copyThemeCustomSapUiCommonsSupport', 
		   'copy:copyThemeCustomSapUiLayoutSupport', 'copy:copyThemeCustomSapMSupport',
		   
		   'copy:copyThemeCustomFlagIconCssImg'
	]
  );
  
  //Build Custom Theme to use when theme "sap_bluecrystal" is selected
  grunt.registerTask(
	'build-theme-custom-sap', 
	[
	 		'clean:dist', 'less:compileThemeCustom', 'build-theme-bs', 
	 		'copy:copyThemeCustomSapBootstrapFonts', 'copy:copyThemeCustomSapFontAwesomeFonts', 
	 		'copy:copyThemeCustomSapMyFonts', 'copy:copyThemeCustomSapMyImages', 
	 		'copy:copyThemeCustomSapCssLibrary', 'copy:copyThemeCustomSapCssLibraryDebug',
	 		
	 		'copy:copyThemeCustomSapFlagIconCssImg'
	]
  );
  
  /*
  * ---------------------------- 
  * END Ui5Strap Theme Builder
  * ----------------------------
  */
  
  
  // Default task.
  grunt.registerTask('default', ['clean:dist', 'copy:fonts', 'test']);

  // Version numbering task.
  // grunt change-version-number --oldver=A.B.C --newver=X.Y.Z
  // This can be overzealous, so its changes should always be manually reviewed!
  grunt.registerTask('change-version-number', 'sed');

  grunt.registerTask('build-glyphicons-data', function () { generateGlyphiconsData.call(this, grunt); });

  // task for building customizer
  grunt.registerTask('build-customizer', ['build-customizer-html', 'build-raw-files']);
  grunt.registerTask('build-customizer-html', 'jade');
  grunt.registerTask('build-raw-files', 'Add scripts/less files to customizer.', function () {
    var banner = grunt.template.process('<%= banner %>');
    generateRawFiles(grunt, banner);
  });

  grunt.registerTask('commonjs', 'Generate CommonJS entrypoint module in dist dir.', function () {
    var srcFiles = grunt.config.get('concat.bootstrap.src');
    var destFilepath = 'dist/js/npm.js';
    generateCommonJSModule(grunt, srcFiles, destFilepath);
  });

  // Docs task.
  grunt.registerTask('docs-css', ['autoprefixer:docs', 'autoprefixer:examples', 'csscomb:docs', 'csscomb:examples', 'cssmin:docs']);
  grunt.registerTask('lint-docs-css', ['csslint:docs', 'csslint:examples']);
  grunt.registerTask('docs-js', ['uglify:docsJs', 'uglify:customize']);
  grunt.registerTask('lint-docs-js', ['jshint:assets', 'jscs:assets']);
  grunt.registerTask('docs', ['docs-css', 'lint-docs-css', 'docs-js', 'lint-docs-js', 'clean:docs', 'copy:docs', 'build-glyphicons-data', 'build-customizer']);

  grunt.registerTask('prep-release', ['dist', 'docs', 'jekyll:github', 'htmlmin', 'compress']);

  // Task for updating the cached npm packages used by the Travis build (which are controlled by test-infra/npm-shrinkwrap.json).
  // This task should be run and the updated file should be committed whenever Bootstrap's dependencies change.
  grunt.registerTask('update-shrinkwrap', ['exec:npmUpdate', '_update-shrinkwrap']);
  grunt.registerTask('_update-shrinkwrap', function () {
    var done = this.async();
    npmShrinkwrap({ dev: true, dirname: __dirname }, function (err) {
      if (err) {
        grunt.fail.warn(err);
      }
      var dest = 'test-infra/npm-shrinkwrap.json';
      fs.renameSync('npm-shrinkwrap.json', dest);
      grunt.log.writeln('File ' + dest.cyan + ' updated.');
      done();
    });
  });
};
