// action bar
const run_button = document.querySelector('#run_btn');
const save_button = document.querySelector('#save_btn');
const reset_button = document.querySelector('#reset_btn');
const import_button = document.querySelector('#import_btn');
const exit_button = document.querySelector('#exit_btn');

const new_captcha_button = document.querySelector('#new_captcha_btn');
const new_autofill_button = document.querySelector('#new_autofill_btn');
const new_autocheck_button = document.querySelector('#new_autocheck_btn');
const new_injectjs_button = document.querySelector('#new_injectjs_btn');
const new_cookie_button = document.querySelector('#new_cookie_btn');
const new_checkall_button = document.querySelector('#new_checkall_btn');

// preference
const homepage = document.querySelector('#homepage');
const refresh_datetime = document.querySelector('#refresh_datetime');
const memo = document.querySelector('#memo');

// advance
const proxy_server_port = document.querySelector('#proxy_server_port');
const window_size = document.querySelector('#window_size');
const play_sound_filename = document.querySelector('#play_sound_filename');

const adblock = document.querySelector('#adblock');
const hide_some_image = document.querySelector('#hide_some_image');
const block_facebook_network = document.querySelector('#block_facebook_network');

const ocr_captcha_enable = document.querySelector('#ocr_captcha_enable');
const ocr_captcha_use_public_server = document.querySelector('#ocr_captcha_use_public_server');
const remote_url = document.querySelector('#remote_url');
const PUBLIC_SERVER_URL = "http://maxbot.dropboxlike.com:16888/";

const json_url = document.querySelector('#json_url');
const show_injectjs_advanced_field = document.querySelector('#show_injectjs_advanced_field');

var settings = null;

maxbot_load_api();

function load_settins_to_form(settings) {
    if (settings) {
        homepage.value = settings.homepage;
        refresh_datetime.value = settings.refresh_datetime;
        memo.value = settings.memo;

        proxy_server_port.value = settings.advanced.proxy_server_port;
        window_size.value = settings.advanced.window_size;
        play_sound_filename.value = settings.advanced.play_sound_filename;

        adblock.checked = settings.advanced.adblock;
        hide_some_image.checked = settings.advanced.hide_some_image;
        block_facebook_network.checked = settings.advanced.block_facebook_network;

        ocr_captcha_enable.checked = settings.ocr_captcha.enable;

        let remote_url_string = "";
        let remote_url_array = [];
        if (settings.advanced.remote_url.length > 0) {
            remote_url_array = JSON.parse('[' + settings.advanced.remote_url + ']');
        }
        if (remote_url_array.length) {
            remote_url_string = remote_url_array[0];
        }
        remote_url.value = remote_url_string;

        if (settings.ocr_captcha.captcha.length) {
            settings.ocr_captcha.captcha.forEach((d) => {
                captcha_new_with_value(d);
            });
        }

        if (settings.autofill.length) {
            settings.autofill.forEach((d) => {
                autofill_new_with_value(d);
            });
        }

        if (settings.autocheck.length) {
            settings.autocheck.forEach((d) => {
                autocheck_new_with_value(d);
            });
        }

        if (settings.injectjs.length) {
            settings.injectjs.forEach((d) => {
                injectjs_new_with_value(d);
            });
        }

        if (settings.cookie.length) {
            settings.cookie.forEach((d) => {
                cookie_new_with_value(d);
            });
        }

        if (settings.checkall.length) {
            settings.checkall.forEach((d) => {
                checkall_new_with_value(d);
            });
        }

        initai_captcha();
        initai_autofill();
        initai_autocheck();
        initai_injectjs();
        initai_cookie();
        initai_checkall();
    } else {
        console.log('no settings found');
    }
}

function maxbot_load_api() {
    let api_url = "http://127.0.0.1:16888/load";
    $.get(api_url, function() {
            //alert( "success" );
        })
        .done(function(data) {
            //alert( "second success" );
            //console.log(data);
            settings = data;
            load_settins_to_form(data);
        })
        .fail(function() {
            //alert( "error" );
        })
        .always(function() {
            //alert( "finished" );
        });
}

function maxbot_reset_api() {
    captcha_reset();
    autofill_reset();
    autocheck_reset();
    injectjs_reset();
    cookie_reset();
    checkall_reset();

    let api_url = "http://127.0.0.1:16888/reset";
    $.get(api_url, function() {
            //alert( "success" );
        })
        .done(function(data) {
            //console.log(data);
            settings = data;
            load_settins_to_form(data);
            run_message("已重設為預設值");
        })
        .fail(function() {
            //alert( "error" );
        })
        .always(function() {
            //alert( "finished" );
        });
}

function maxbot_import_api() {
    $("#importJsonModal").modal('show');
    $("#json_url").val("");
    $("#json-import-btn").addClass("disabled");
}

function checkUsePublicServer() {
    remote_url.value = PUBLIC_SERVER_URL;
}

function showHideInjectjsAdvnacedField() {
    if (show_injectjs_advanced_field.checked) {
        $("div[injectjs-advanced='true']").removeClass("disappear");
    } else {
        $("div[injectjs-advanced='true']").addClass("disappear");
    }
}

function jon_url_onchange() {
    let target_url = $("#json_url").val();
    if (target_url.length > 0) {
        $("#json-import-btn").removeClass("disabled");
    } else {
        $("#json-import-btn").addClass("disabled");
    }
}

function json_import() {
    $("#importJsonModal").modal('hide');
    captcha_reset();
    autofill_reset();
    autocheck_reset();
    injectjs_reset();
    cookie_reset();
    checkall_reset();

    let target_url = $("#json_url").val();
    const body = JSON.stringify({
        url: target_url
    });

    let api_url = "http://127.0.0.1:16888/import";
    $.post(api_url, body, function() {
            //alert( "success" );
        })
        .done(function(data) {
            console.log(data);
            settings = data;
            load_settins_to_form(data);
        })
        .fail(function() {
            //alert( "error" );
        })
        .always(function() {
            //alert( "finished" );
        });
}

let messageClearTimer;

function message(msg) {
    $("#message_detail").html("存檔完成");
    $("#message_modal").modal("show");
}

function message_old(msg) {
    clearTimeout(messageClearTimer);
    const message = document.querySelector('#message');
    message.innerText = msg;
    messageClearTimer = setTimeout(function() {
        message.innerText = '';
    }, 3000);
}

function maxbot_launch() {
    run_message("啟動 DDDDEXT 主程式中...");
    save_changes_to_dict(true);
    maxbot_save_api(maxbot_run_api());
}

function maxbot_run_api() {
    let api_url = "http://127.0.0.1:16888/run";
    $.get(api_url, function() {
            //alert( "success" );
        })
        .done(function(data) {
            //alert( "second success" );
        })
        .fail(function() {
            //alert( "error" );
        })
        .always(function() {
            //alert( "finished" );
        });
}

function maxbot_shutdown_api() {
    let api_url = "http://127.0.0.1:16888/shutdown";
    $.get(api_url, function() {
            //alert( "success" );
        })
        .done(function(data) {
            //alert( "second success" );
            window.close();
        })
        .fail(function() {
            //alert( "error" );
        })
        .always(function() {
            //alert( "finished" );
        });
}

function get_autofill_array() {
    let autofill = [];
    let last_node = $("#autofill-container tr[data-index]").last().attr("data-index");
    let node = 0;
    if (last_node) {
        node = parseInt(last_node);
    }
    if (node > 0) {
        for (let i = 1; i <= node; i++) {
            let item = {};
            item["enable"] = true;
            if ($("#autofill_url_" + i).length) {
                item["url"] = $("#autofill_url_" + i).val();
                item["selector"] = $("#autofill_selector_" + i).val();
                item["value"] = $("#autofill_value_" + i).val();
                autofill.push(item);
            }
        }
    }
    return autofill;
}

function get_autocheck_array() {
    let autocheck = [];
    let last_node = $("#autocheck-container tr[data-index]").last().attr("data-index");
    let node = 0;
    if (last_node) {
        node = parseInt(last_node);
    }
    if (node > 0) {
        for (let i = 1; i <= node; i++) {
            let item = {};
            item["enable"] = true;
            if ($("#autocheck_url_" + i).length) {
                item["url"] = $("#autocheck_url_" + i).val();
                item["selector"] = $("#autocheck_selector_" + i).val();
                item["value"] = $("#autocheck_value_" + i).prop("checked");
                autocheck.push(item);
            }
        }
    }
    return autocheck;
}

function get_captcha_array() {
    let captcha = [];
    let last_node = $("#captcha-container tr[data-index]").last().attr("data-index");
    let node = 0;
    if (last_node) {
        node = parseInt(last_node);
    }
    if (node > 0) {
        for (let i = 1; i <= node; i++) {
            let item = {};
            item["enable"] = true;
            if ($("#captcha_url_" + i).length) {
                item["url"] = $("#captcha_url_" + i).val();
                item["captcha"] = $("#captcha_selector_" + i).val();
                item["captcha_renew"] = $("#captcha_renew_selector_" + i).val();
                item["input"] = $("#input_selector_" + i).val();
                item["maxlength"] = $("#maxlength_" + i).val();
                if (item["maxlength"] == "" || item["maxlength"] == "0") {
                    item["maxlength"] = 0;
                }
                captcha.push(item);
            }
        }
    }
    return captcha;
}

function get_injectjs_array() {
    let injectjs = [];
    let last_node = $("#injectjs-container tr[data-index]").last().attr("data-index");
    let node = 0;
    if (last_node) {
        node = parseInt(last_node);
    }
    if (node > 0) {
        for (let i = 1; i <= node; i++) {
            let item = {};
            item["enable"] = true;
            if ($("#injectjs_url_" + i).length) {
                item["url"] = $("#injectjs_url_" + i).val();
                item["script"] = $("#injectjs_script_" + i).val();
                item["run_at"] = $("#injectjs_run_at_" + i).val();

                item["world"] = $("#injectjs_world_" + i).val();
                if (item["run_at"] == "") {
                    item["run_at"] = "document_end";
                }
                if (item["world"] == "") {
                    item["world"] = "ISOLATED";
                }
                injectjs.push(item);
            }
        }
    }
    return injectjs;
}

function get_cookie_array() {
    let cookie = [];
    let last_node = $("#cookie-container tr[data-index]").last().attr("data-index");
    let node = 0;
    if (last_node) {
        node = parseInt(last_node);
    }
    if (node > 0) {
        for (let i = 1; i <= node; i++) {
            let item = {};
            item["enable"] = true;
            if ($("#cookie_domain_" + i).length) {
                item["domain"] = $("#cookie_domain_" + i).val();
                item["key"] = $("#cookie_key_" + i).val();
                item["value"] = $("#cookie_value_" + i).val();
                item["path"] = "/";
                item["http_only"] = true;
                item["secure"] = true;
                cookie.push(item);
            }
        }
    }
    return cookie;
}

function get_checkall_array() {
    let checkall = [];
    let last_node = $("#checkall-container tr[data-index]").last().attr("data-index");
    let node = 0;
    if (last_node) {
        node = parseInt(last_node);
    }
    if (node > 0) {
        for (let i = 1; i <= node; i++) {
            let item = {};
            item["enable"] = true;
            if ($("#checkall_url_" + i).length) {
                item["url"] = $("#checkall_url_" + i).val();
                checkall.push(item);
            }
        }
    }
    return checkall;
}

function save_changes_to_dict(silent_flag) {
    if (settings) {

        // preference
        settings.homepage = homepage.value;
        settings.refresh_datetime = refresh_datetime.value;
        settings.memo = memo.value;

        // advanced
        settings.advanced.proxy_server_port = proxy_server_port.value;
        settings.advanced.window_size = window_size.value;
        settings.advanced.play_sound_filename = play_sound_filename.value;

        settings.advanced.adblock = adblock.checked;
        settings.advanced.hide_some_image = hide_some_image.checked;
        settings.advanced.block_facebook_network = block_facebook_network.checked;

        settings.ocr_captcha.enable = ocr_captcha_enable.checked;
        let remote_url_array = [];
        remote_url_array.push(remote_url.value);
        let remote_url_string = JSON.stringify(remote_url_array);
        remote_url_string = remote_url_string.substring(0, remote_url_string.length - 1);
        remote_url_string = remote_url_string.substring(1);
        //console.log("final remote_url_string:"+remote_url_string);

        settings.advanced.remote_url = remote_url_string;

        settings.ocr_captcha.captcha = get_captcha_array();
        settings.autofill = get_autofill_array();
        settings.autocheck = get_autocheck_array();
        settings.injectjs = get_injectjs_array();
        settings.cookie = get_cookie_array();
        settings.checkall = get_checkall_array();

    }
    if (!silent_flag) {
        message('已存檔');
    }
}

function maxbot_save_api(callback) {
    let api_url = "http://127.0.0.1:16888/save";
    if (settings) {
        $.post(api_url, JSON.stringify(settings), function() {
                //alert( "success" );
            })
            .done(function(data) {
                //alert( "second success" );
                check_unsaved_fields();
                if (callback) callback;
            })
            .fail(function() {
                //alert( "error" );
            })
            .always(function() {
                //alert( "finished" );
            });
    }
}

function maxbot_save() {
    save_changes_to_dict(false);
    maxbot_save_api();
}

function ddddext_version_api() {
    let api_url = "http://127.0.0.1:16888/version";
    $.get(api_url, function() {
            //alert( "success" );
        })
        .done(function(data) {
            $("#ddddext_version").html(data.version);
        })
        .fail(function() {
            //alert( "error" );
        })
        .always(function() {
            //alert( "finished" );
        });
}

function check_unsaved_fields() {
    if (settings) {
        const field_list_basic = ["homepage", "refresh_datetime", "memo"];
        field_list_basic.forEach(f => {
            const field = document.querySelector('#' + f);
            if (field.value != settings[f]) {
                $("#" + f).addClass("is-invalid");
            } else {
                $("#" + f).removeClass("is-invalid");
            }
        });
        const field_list_advance = [
            "remote_url",
            "proxy_server_port",
            "window_size",
            "play_sound_filename"
        ];
        field_list_advance.forEach(f => {
            const field = document.querySelector('#' + f);
            let formated_input = field.value;
            let formated_saved_value = settings["advanced"][f];
            //console.log(f);
            //console.log(field.value);
            //console.log(formated_saved_value);
            if (typeof formated_saved_value == "string") {
                if (formated_input == '')
                    formated_input = '""';
                if (formated_saved_value == '')
                    formated_saved_value = '""';
                if (formated_saved_value.indexOf('"') > -1) {
                    if (formated_input.length) {
                        if (formated_input != '""') {
                            formated_input = '"' + formated_input + '"';
                        }
                    }
                }
            }
            let is_not_match = (formated_input != formated_saved_value);
            if (is_not_match) {
                //console.log(f);
                //console.log(formated_input);
                //console.log(formated_saved_value);
                $("#" + f).addClass("is-invalid");
            } else {
                $("#" + f).removeClass("is-invalid");
            }
        });
    }
}

ddddext_version_api();

run_button.addEventListener('click', maxbot_launch);
save_button.addEventListener('click', maxbot_save);
reset_button.addEventListener('click', maxbot_reset_api);
import_button.addEventListener('click', maxbot_import_api);
exit_button.addEventListener('click', maxbot_shutdown_api);

new_captcha_button.addEventListener('click', captcha_new);
new_autofill_button.addEventListener('click', autofill_new);
new_autocheck_button.addEventListener('click', autocheck_new);
new_injectjs_button.addEventListener('click', injectjs_new);
new_cookie_button.addEventListener('click', cookie_new);
new_checkall_button.addEventListener('click', checkall_new);

ocr_captcha_use_public_server.addEventListener('change', checkUsePublicServer);
json_url.addEventListener('input', jon_url_onchange);
show_injectjs_advanced_field.addEventListener('change', showHideInjectjsAdvnacedField);

const onchange_tag_list = ["input", "select", "textarea"];
onchange_tag_list.forEach((tag) => {
    const input_items = document.querySelectorAll(tag);
    input_items.forEach((userItem) => {
        userItem.addEventListener('change', check_unsaved_fields);
    });
});

homepage.addEventListener('keyup', check_unsaved_fields);

let runMessageClearTimer;

function run_message(msg) {
    clearTimeout(runMessageClearTimer);
    const message = document.querySelector('#run_btn_pressed_message');
    message.innerText = msg;
    messageClearTimer = setTimeout(function() {
        message.innerText = '';
    }, 3000);
}

const importJsonModal = document.getElementById('importJsonModal');
importJsonModal.addEventListener('shown.bs.modal', () => {
    const input_field = document.getElementById('json_url');
    if (input_field != null) {
        input_field.focus();
    }
});

function captcha_reset() {
    let last_node = $("#captcha-container tr[data-index]").remove();
}

function captcha_new() {
    captcha_new_with_value();
}

function captcha_new_with_value(item) {
    let last_node = $("#captcha-container tr[data-index]").last().attr("data-index");
    let node = 1;
    if (last_node) {
        node = parseInt(last_node) + 1;
    }
    let html = $("#captcha-template").html();
    if (html) {
        html = html.replace(/@node@/g, "" + node);
        //console.log(html);
        $("#captcha-container").append(html);
        $("#captcha-actionbar").insertAfter($("#captcha-container tr").last());

        if (item) {
            $("#captcha_url_" + node).val(item["url"]);
            $("#captcha_selector_" + node).val(item["captcha"]);
            $("#captcha_renew_selector_" + node).val(item["captcha_renew"]);
            $("#input_selector_" + node).val(item["input"]);
            let maxlength = item["maxlength"];
            if (maxlength == 0) {
                maxlength = "";
            }
            $("#maxlength_" + node).val(maxlength);
        }
    }
}

function captcha_remove(node) {
    $("#captcha-container tr[data-index='" + node + "']").remove();
}

function initai_captcha() {
    let last_node = $("#captcha-container tr[data-index]").last().attr("data-index");
    if (!last_node) {
        captcha_new();
    }
}

function autofill_reset() {
    let last_node = $("#autofill-container tr[data-index]").remove();
}

function autofill_new() {
    autofill_new_with_value();
}

function autofill_new_with_value(item) {
    let last_node = $("#autofill-container tr[data-index]").last().attr("data-index");
    let node = 1;
    if (last_node) {
        node = parseInt(last_node) + 1;
    }
    let html = $("#autofill-template").html();
    html = html.replace(/@node@/g, "" + node);
    //console.log(html);
    $("#autofill-container").append(html);
    $("#autofill-actionbar").insertAfter($("#autofill-container tr").last());

    if (item) {
        $("#autofill_url_" + node).val(item["url"]);
        $("#autofill_selector_" + node).val(item["selector"]);
        $("#autofill_value_" + node).val(item["value"]);
    }
}

function autofill_remove(node) {
    $("#autofill-container tr[data-index='" + node + "']").remove();
}

function initai_autofill() {
    let last_node = $("#autofill-container tr[data-index]").last().attr("data-index");
    if (!last_node) {
        autofill_new();
    }
}

function autocheck_reset() {
    let last_node = $("#autocheck-container tr[data-index]").remove();
}

function autocheck_new() {
    autocheck_new_with_value();
}

function autocheck_new_with_value(item) {
    let last_node = $("#autocheck-container tr[data-index]").last().attr("data-index");
    let node = 1;
    if (last_node) {
        node = parseInt(last_node) + 1;
    }
    let html = $("#autocheck-template").html();
    html = html.replace(/@node@/g, "" + node);
    //console.log(html);
    $("#autocheck-container").append(html);
    $("#autocheck-actionbar").insertAfter($("#autocheck-container tr").last());

    if (item) {
        $("#autocheck_url_" + node).val(item["url"]);
        $("#autocheck_selector_" + node).val(item["selector"]);
        $("#autocheck_value_" + node).prop("checked", item["value"]);
    }
}

function autocheck_remove(node) {
    $("#autocheck-container tr[data-index='" + node + "']").remove();
}

function initai_autocheck() {
    let last_node = $("#autocheck-container tr[data-index]").last().attr("data-index");
    if (!last_node) {
        autocheck_new();
    }
}

function injectjs_reset() {
    let last_node = $("#injectjs-container tr[data-index]").remove();
}

function injectjs_new() {
    injectjs_new_with_value();
}

function injectjs_new_with_value(item) {
    let last_node = $("#injectjs-container tr[data-index]").last().attr("data-index");
    let node = 1;
    if (last_node) {
        node = parseInt(last_node) + 1;
    }
    let html = $("#injectjs-template").html();
    if (html) {
        html = html.replace(/@node@/g, "" + node);
        //console.log(html);
        $("#injectjs-container").append(html);
        $("#injectjs-actionbar").insertAfter($("#injectjs-container tr").last());

        if (item === undefined) {
            item = { url: "", script: "", run_at: "document_end", world: "ISOLATED" };
        }
        if (item) {
            $("#injectjs_url_" + node).val(item["url"]);
            $("#injectjs_script_" + node).val(item["script"]);
            $("#injectjs_run_at_" + node).val(item["run_at"]);
            $("#injectjs_world_" + node).val(item["world"]);
        }
    }
}

function injectjs_remove(node) {
    $("#injectjs-container tr[data-index='" + node + "']").remove();
}

function initai_injectjs() {
    let last_node = $("#injectjs-container tr[data-index]").last().attr("data-index");
    if (!last_node) {
        injectjs_new();
    }
}

function cookie_reset() {
    let last_node = $("#cookie-container tr[data-index]").remove();
}

function cookie_new() {
    cookie_new_with_value();
}

function cookie_new_with_value(item) {
    let last_node = $("#cookie-container tr[data-index]").last().attr("data-index");
    let node = 1;
    if (last_node) {
        node = parseInt(last_node) + 1;
    }
    let html = $("#cookie-template").html();
    if (html) {
        html = html.replace(/@node@/g, "" + node);
        //console.log(html);
        $("#cookie-container").append(html);
        $("#cookie-actionbar").insertAfter($("#cookie-container tr").last());

        if (item) {
            $("#cookie_key_" + node).val(item["key"]);
            $("#cookie_value_" + node).val(item["value"]);
            $("#cookie_domain_" + node).val(item["domain"]);
        }
    }
}

function cookie_remove(node) {
    $("#cookie-container tr[data-index='" + node + "']").remove();
}

function initai_cookie() {
    let last_node = $("#cookie-container tr[data-index]").last().attr("data-index");
    if (!last_node) {
        cookie_new();
    }
}

function checkall_reset() {
    let last_node = $("#checkall-container tr[data-index]").remove();
}

function checkall_new() {
    checkall_new_with_value();
}

function checkall_new_with_value(item) {
    let last_node = $("#checkall-container tr[data-index]").last().attr("data-index");
    let node = 1;
    if (last_node) {
        node = parseInt(last_node) + 1;
    }
    let html = $("#checkall-template").html();
    if (html) {
        html = html.replace(/@node@/g, "" + node);
        //console.log(html);
        $("#checkall-container").append(html);
        $("#checkall-actionbar").insertAfter($("#checkall-container tr").last());

        if (item) {
            $("#checkall_url_" + node).val(item["url"]);
        }
    }
}

function checkall_remove(node) {
    $("#checkall-container tr[data-index='" + node + "']").remove();
}

function initai_checkall() {
    let last_node = $("#checkall-container tr[data-index]").last().attr("data-index");
    if (!last_node) {
        checkall_new();
    }
}