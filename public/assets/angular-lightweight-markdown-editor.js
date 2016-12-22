(function() {
    angular.module("angular-lightweight-markdown-editor", [
        "ngSanitize"
    ]).directive("markdownEditor", angularMarkdownEditor);

    var textareaElement;
    var translationTexts = {
        "textPreview": "Preview",
        "textProvideText": "Please provide link text",
        "textProvideLink": "Please provide link URL"
    };

    if (typeof showdown !== "undefined") {
        var mdConverter = new showdown.Converter();
    }

    var defaultOptions = {
        controls: [
            "bold",
            "italic",
            "heading",            
            "strikethrough",
            "link",
            "bullets",
            "numbers",
            "code",
            "quote",
            "indent",
            "preview"
        ]
    };

    var options = {};

    function angularMarkdownEditor() {
        return {
            restrict: "E",
            templateUrl: "angular-lightweight-markdown-template.html",
            controller: markdownController,
            controllerAs: "markdownEditorCtrl",
            scope: true,
            bindToController: {
                ngModel: "=",
                textPreview: "@",
                textProvideText: "@",
                textProvideLink: "@",
                showPreview: "=?",
                options: "=?"
            },
            require: ['^?form', '?ngModel'],
            link: function(scope, element, attrs, ctrls) {
                textareaElement = element.find("textarea")[0];
                var form = ctrls[0];
                var copyAttrToTextarea = [
                    "name", "required", "minLength", "maxLength", "placeholder", "selectionDirection", "selectionStart", "selectionEnd", "spellcheck"
                ];
                angular.forEach(copyAttrToTextarea, function(param) {
                    if (attrs[param]) {
                        textareaElement[param] = attrs[param];
                    }
                });
                angular.element(textareaElement).text(this.ngModel);
            }
        }
    }

    function markdownController($sce) {
        this.preview = false;
        this.active = false;
        
		if(typeof this.showPreview !== "undefined") {
        	this.preview = this.showPreview;
        }

        this.showdownEnabled = (typeof showdown !== "undefined");

        for (var key in translationTexts) {
            if (angular.isDefined(this[key])) {
                translationTexts[key] = this[key];
            }
        }
        this.translations = translationTexts;

        this.action = function(name) {
            var result = actions[name](this.ngModel, getSelectionInfo());
            if (result !== false) {
                this.ngModel = result;
            }
        };

        this.getHTML = function() {
            /*
            if (!this.showdownEnabled) {
                return "";
            }
            return $sce.trustAsHtml(mdConverter.makeHtml(this.ngModel));
            */
            if(typeof this.ngModel == 'undefined' || typeof markdown == 'undefined') return "";
            return $sce.trustAsHtml(markdown.toHTML(this.ngModel));
        };

        this.options = angular.extend({}, defaultOptions, this.options);
        this.icons = icons;
    }

    function getSelectionInfo() {
        var l = textareaElement.selectionEnd - textareaElement.selectionStart;
        return {
            start: textareaElement.selectionStart,
            end: textareaElement.selectionEnd,
            length: l,
            text: textareaElement.value.substr(textareaElement.selectionStart, l)
        };
    }

    function getSelection() {

        // var e = this.$textarea[0];
        var e = textareaElement;

        return (

          ('selectionStart' in e && function() {
              var l = e.selectionEnd - e.selectionStart;
              return { start: e.selectionStart, end: e.selectionEnd, length: l, text: e.value.substr(e.selectionStart, l) };
          }) ||

          /* browser not supported */
          function() {
            return null;
          }

        )();

    }

    function setSelection(start,end) {

        // var e = this.$textarea[0];
        var e = textareaElement;
        
        return (

          ('selectionStart' in e && function() {
              e.selectionStart = start;
              e.selectionEnd = end;
              return;
          }) ||

          /* browser not supported */
          function() {
            return null;
          }

        )();

    }

    function replaceSelection(text) {

        // var e = this.$textarea[0];
        var e = textareaElement;

        return (

          ('selectionStart' in e && function() {
              e.value = e.value.substr(0, e.selectionStart) + text + e.value.substr(e.selectionEnd, e.value.length);
              // Set cursor to the last replacement end
              e.selectionStart = e.value.length;
              return this;
          }) ||

          /* browser not supported */
          function() {
              e.value += text;
              return jQuery(e);
          }

        )();
    }    
    
    var actions = {
        bold: function(model, selection) {
            /*
            if (selection.length == 0) {
                return model;
            }

            return helpers.surround(model, selection.start, selection.end - selection.start, "**", "**");
            */
    
            // Give/remove ** surround the selection
            var chunk, cursor;

            if (selection.length === 0) {
              // append some text
              chunk = 'strong text';
            } 
            else {
              chunk = selection.text;
            }

            // transform selection and set the cursor into chunked text
            if (model.substr(selection.start-2,2) === '**' && model.substr(selection.end,2) === '**' ) {
              setSelection(selection.start-2,selection.end+2);
              replaceSelection(chunk);
              cursor = selection.start-2;
            } 
            else if (model.substr(selection.start,2) === '**' && model.substr(selection.end-2,2) === '**' ) {
                replaceSelection(chunk.substr(2,chunk.length-4));
                cursor = selection.start;
            }
            else {
              replaceSelection('**'+chunk+'**');
              cursor = selection.start+2;
            }

            // Set the cursor
            setSelection(cursor,cursor+chunk.length);
            
            return textareaElement.value;
        },
        italic: function(model, selection) {
            if (selection.length == 0) {
                return model;
            }

            return helpers.surround(model, selection.start, selection.end - selection.start, "*", "*");
        },
        bullets: function(model, selection) {
            return helpers.startLinesWith(model, selection.start, selection.end, "* ");
        },
        numbers: function(model, selection) {
            return helpers.startLinesWith(model, selection.start, selection.end, "1. ");
        },
        heading: function(model, selection) {
            return helpers.startLinesWith(model, selection.start, selection.end, "#");
        },
        heading2: function(model, selection) {
            return helpers.startLinesWith(model, selection.start, selection.end, "##");
        },
        heading3: function(model, selection) {
            return helpers.startLinesWith(model, selection.start, selection.end, "###");
        },
        strikethrough: function(model, selection) {
            if (selection.length == 0) {
                return model;
            }

            return helpers.surround(model, selection.start, selection.end - selection.start, "--", "--");
        },
        indent: function(model, selection) {
            return helpers.startLinesWith(model, selection.start, selection.end, "\t");
        },
        quote: function(model, selection) {
            return helpers.startLinesWith(model, selection.start, selection.end, "> ");
        },
        code: function(model, selection) {
            if (selection.length == 0) {
                return model;
            }

            var startpos = model.substr(0, selection.start).lastIndexOf("\n") + 1;
            var nextNewLine = model.substr(selection.end).indexOf("\n");
            if (nextNewLine == -1) {
                var endpos = model.length;
            } else {
                var endpos = selection.end + nextNewLine + 1;
            }
            return [
                model.substr(0, startpos),
                "```\n",
                model.substr(startpos, endpos - startpos),
                "\n```\n",
                model.substr(endpos)
            ].join("");
        },
        link: function(model, selection) {
            if (selection.length > 0) {
                var text = model.substr(selection.start, selection.length);
            } else {
                var text = prompt(translationTexts["textProvideText"]);
                if (!text) {
                    return false;
                }
            }
            var link = prompt(translationTexts["textProvideLink"]);
            if (!link) {
                return false;
            }

            return [
                model.substr(0, selection.start),
                "[" + text + "]",
                "(" + link + ")",
                model.substr(selection.end)
            ].join("");
        }
    };


    var helpers = {
        surround: function(text, start, length, before, after) {
            var between = text.substr(start, length);
            return [
                text.substr(0, start),
                (before ? before : ""),
                between,
                (after ? after : ""),
                text.substr(start + length)
            ].join("");
        },
        startLinesWith: function(text, start, end, startWith) {
            var lineStartPositions = helpers.indexes(text.substr(start, end - start), "\n", start);
            var firstpos = text.substr(0, start).lastIndexOf("\n") + 1;
            text = [text.substr(0, firstpos), startWith, text.substr(firstpos)].join("");
            for (var i = 0; i < lineStartPositions.length; i++) {
                text = [
                    text.substr(0, startWith.length * (i+1) + lineStartPositions[i] + 1),
                    startWith,
                    text.substr(startWith.length * (i+1) + lineStartPositions[i] + 1)
                ].join("");
            }
            return text;
        },
        indexes: function(source, find, add) {
            var result = [];
            for (i = 0; i < source.length; ++i) {
                if (source.substring(i, i + find.length) == find) {
                    result.push(i + add);
                }
            }
            return result;
        }
    };

    var icons = {
        "bold": "fa fa-bold",
        "italic": "fa fa-italic",
        "strikethrough": "fa fa-strikethrough",
        "heading": "fa fa-header",
        "bullets": "fa fa-list-ul",
        "numbers": "fa fa-list-ol",
        "indent": "fa fa-indent",
        "code": "fa fa-code",
        "link": "fa fa-link",
        "quote": "fa fa-quote-right"
    };
})();
