/*!
 * Image (upload) dialog for upyun(又拍云) plugin for Editor.md
 */

(function () {
    var factory = function (exports) {
        var pluginName = "image-dialog-upyun";
        exports.fn.imageDialogUpyun = function () {
        var cm = this.cm;
        var lang = this.lang;
        var editor = this.editor;
        var settings = this.settings;
        var cursor = cm.getCursor();
        var selection = cm.getSelection();
        var imageLang = lang.dialog.image;
        var classPrefix = this.classPrefix;
        var dialogName = classPrefix + pluginName, dialog;
        cm.focus();
        var loading = function (show) {
            var _loading = dialog.find("." + classPrefix + "dialog-mask");
            _loading[(show) ? "show" : "hide"]();
        };
        if (editor.find("." + dialogName).length < 1) {
            var guid = (new Date).getTime();
            var dialogContent = '';
            if(settings.imageUpload){
                dialogContent += '<form id="cloudUploadForm" method="post" enctype="multipart/form-data" class="'+ classPrefix + 'form" onsubmit="return false;">';
            }
            dialogContent += '<div class="' + classPrefix + 'form"><label>图片地址</label><input type="text" data-url=""/>';
            if(settings.imageUpload){
                dialogContent += '<div class="' + classPrefix + 'file-input"><input type="file" name="file" accept="image/*" /><input type="submit" value="上云" /></div>';
            }
            dialogContent += '<br/><label>图片描述(alt)</label><input type="text"  data-alt=""/><br/><label>链接地址</label><input type="text" value="https://" data-link=""/>';
            dialogContent += settings.imageUpload ? '</form>' : '</div>';

            dialog = this.createDialog({
                title: imageLang.title,
                width: (settings.imageUpload) ? 465 : 380,
                height: 254,
                name: dialogName,
                content: dialogContent,
                mask: settings.dialogShowMask,
                drag: settings.dialogDraggable,
                lockScreen: settings.dialogLockScreen,
                maskStyle: {
                    opacity: settings.dialogMaskOpacity,
                    backgroundColor: settings.dialogMaskBgColor
                },
                buttons: {
                    enter: [lang.buttons.enter, function () {
                        var url = this.find("[data-url]").val();
                        var alt = this.find("[data-alt]").val();
                        var link = this.find("[data-link]").val();
                        if (url === "") {
                            alert(imageLang.imageURLEmpty);
                            return false;
                        }
                        var altAttr = (alt !== "") ? " \"" + alt + "\"" : "";
                        if (link === "" || link === "https://") {
                            cm.replaceSelection("![" + alt + "](" + url + altAttr + ")");
                        }
                        else {
                            cm.replaceSelection("[![" + alt + "](" + url + altAttr + ")](" + link + altAttr + ")");
                        }
                        if (alt === "") {
                            cm.setCursor(cursor.line, cursor.ch + 2);
                        }
                        this.hide().lockScreen(false).hideMask();
                        return false;
                    }],

                    cancel: [lang.buttons.cancel, function () {
                        this.hide().lockScreen(false).hideMask();
                        return false;
                    }]
                }
            });

            dialog.attr("id", classPrefix + "image-dialog-" + guid);
            if (!settings.imageUpload) {
                return;
            }

            var fileInput = dialog.find('[name="file"]');
            var submitHandler = function () {
                var viewBaseUrl='';
                $.ajax({
                    url: settings.uploaderTokenUrl,
                    type: "get",
                    data: {
                        dirName: settings.dirName
                    },
                    dataType: "json",
                    timeout: 2000,
                    beforeSend: function () {
                        loading(true);
                    },
                    success: function (result) {
                        if (result.status != true || result.authorization == "") {
                            loading(false);
                            alert("没有获取到有效的上传令牌，无法上传！");
                            return;
                        }
                        viewBaseUrl = result.viewBaseUrl;
                        var formData = new FormData($("#cloudUploadForm")[0]);
                        formData.append('authorization',result.authorization);
                        formData.append('policy',result.policy);
                        $.ajax({
                            url: result.uploadServer,
                            type: 'POST',
                            data: formData,
                            dataType: "json",
                            beforeSend: function () {
                                loading(true);
                            },
                            cache: false,
                            contentType: false,
                            processData: false,
                            timeout: 30000,
                            success: function (result) {
                                dialog.find("[data-url]").val(viewBaseUrl + result.url);
                            },
                            error: function () {
                                alert("上传出错,请重试");
                            },
                            complete: function () {
                                loading(false);
                            }
                        });

                    }
                });
            };
            dialog.find('[type="submit"]').bind("click", submitHandler);
            fileInput.bind("change", function () {
                var fileName = fileInput.val();
                var isImage = new RegExp("(\\.(" + settings.imageFormats.join("|") + "))$"); // /(\.(webp|jpg|jpeg|gif|bmp|png))$/

                if (fileName === "") {
                    alert(imageLang.uploadFileEmpty);
                    return false;
                }

                if (!isImage.test(fileName)) {
                    alert(imageLang.formatNotAllowed + settings.imageFormats.join(", "));
                    return false;
                }
                dialog.find('#cloudUploadForm [type="submit"]').trigger("click");
            });
        }
        dialog = editor.find("." + dialogName);
        dialog.find('[type="text"]').val("");
        dialog.find('[type="file"]').val("");
        dialog.find("[data-link]").val("https://");
        this.dialogShowMask(dialog);
        this.dialogLockScreen();
        dialog.show();

    };
    };

    // CommonJS/Node.js
    if (typeof require === "function" && typeof exports === "object" && typeof module === "object") {
        module.exports = factory;
    }
    else if (typeof define === "function")  // AMD/CMD/Sea.js
    {
        if (define.amd) { // for Require.js
            define(["editormd"], function (editormd) {
                factory(editormd);
            });

        } else { // for Sea.js
            define(function (require) {
                var editormd = require("./../../editormd");
                factory(editormd);
            });
        }
    }
    else {
        factory(window.editormd);
    }
})();