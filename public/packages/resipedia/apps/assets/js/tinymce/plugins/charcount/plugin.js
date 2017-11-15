(function () {

var defs = {}; // id -> {dependencies, definition, instance (possibly undefined)}

// Used when there is no 'main' module.
// The name is probably (hopefully) unique so minification removes for releases.
var register_3795 = function (id) {
  var module = dem(id);
  var fragments = id.split('.');
  var target = Function('return this;')();
  for (var i = 0; i < fragments.length - 1; ++i) {
    if (target[fragments[i]] === undefined)
      target[fragments[i]] = {};
    target = target[fragments[i]];
  }
  target[fragments[fragments.length - 1]] = module;
};

var instantiate = function (id) {
  var actual = defs[id];
  var dependencies = actual.deps;
  var definition = actual.defn;
  var len = dependencies.length;
  var instances = new Array(len);
  for (var i = 0; i < len; ++i)
    instances[i] = dem(dependencies[i]);
  var defResult = definition.apply(null, instances);
  if (defResult === undefined)
     throw 'module [' + id + '] returned undefined';
  actual.instance = defResult;
};

var def = function (id, dependencies, definition) {
  if (typeof id !== 'string')
    throw 'module id must be a string';
  else if (dependencies === undefined)
    throw 'no dependencies for ' + id;
  else if (definition === undefined)
    throw 'no definition function for ' + id;
  defs[id] = {
    deps: dependencies,
    defn: definition,
    instance: undefined
  };
};

var dem = function (id) {
  var actual = defs[id];
  if (actual === undefined)
    throw 'module [' + id + '] was undefined';
  else if (actual.instance === undefined)
    instantiate(id);
  return actual.instance;
};

var req = function (ids, callback) {
  var len = ids.length;
  var instances = new Array(len);
  for (var i = 0; i < len; ++i)
    instances.push(dem(ids[i]));
  callback.apply(null, callback);
};

var ephox = {};

ephox.bolt = {
  module: {
    api: {
      define: def,
      require: req,
      demand: dem
    }
  }
};

var define = def;
var require = req;
var demand = dem;
// this helps with minificiation when using a lot of global references
var defineGlobal = function (id, ref) {
  define(id, [], function () { return ref; });
};
/*jsc
["tinymce.charcount.Plugin","global!tinymce.PluginManager","global!tinymce.util.Delay","tinymce.charcount.text.CharGetter","tinymce.charcount.text.UnicodeData","tinymce.charcount.text.StringMapper","tinymce.charcount.text.WordBoundary","tinymce.charcount.alien.Arr"]
jsc*/
defineGlobal("global!tinymce.PluginManager", tinymce.PluginManager);
defineGlobal("global!tinymce.util.Delay", tinymce.util.Delay);


/**
 * Plugin.js
 *
 * Released under LGPL License.
 * Copyright (c) 1999-2016 Ephox Corp. All rights reserved
 *
 * License: http://www.tinymce.com/license
 * Contributing: http://www.tinymce.com/contributing
 */

define("tinymce.charcount.Plugin", [
	"global!tinymce.PluginManager",
	"global!tinymce.util.Delay"
], function(PluginManager, Delay) {
	PluginManager.add('charcount', function(editor) {
		var getTextContent = function(editor) {
			return editor.removed ? '' : editor.getBody().innerText;
		};

		var getCount = function() {
            var content = getTextContent(editor);
            var len = content.length;
            if(len == 1 && content[0] == '\n') return 0;
			return len;
		};

		var update = function() {
			editor.theme.panel.find('#charcount').text(['Chars: {0}', getCount()]);
		};

		editor.on('init', function() {
			var statusbar = editor.theme.panel && editor.theme.panel.find('#statusbar')[0];
			var debouncedUpdate = Delay.debounce(update, 300);

			if (statusbar) {
				Delay.setEditorTimeout(editor, function() {
					statusbar.insert({
						type: 'label',
						name: 'charcount',
						text: ['Chars: {0}', getCount()],
						classes: 'wordcount',
                        style: 'right: 100px;',
						disabled: editor.settings.readonly
					}, 0);

					editor.on('setcontent beforeaddundo undo redo keyup', debouncedUpdate);
				}, 0);
			}
		});

		return {
			getCount: getCount
		};
	});

	return function () {};
});

dem('tinymce.charcount.Plugin')();
})();
