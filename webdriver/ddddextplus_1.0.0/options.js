const storage = chrome.storage.local;

const save_button = document.querySelector('#save_btn');
const new_captcha_button = document.querySelector('#new_captcha_btn');
const new_autofill_button = document.querySelector('#new_autofill_btn');
const new_autocheck_button = document.querySelector('#new_autocheck_btn');
const new_checkall_button = document.querySelector('#new_checkall_btn');

const ocr_captcha_enable = document.querySelector('#ocr_captcha_enable');
const ocr_captcha_use_public_server = document.querySelector('#ocr_captcha_use_public_server');
const remote_url = document.querySelector('#remote_url');

const PUBLIC_SERVER_URL = "http://maxbot.dropboxlike.com:16888/";

var settings = null;

loadChanges();

save_button.addEventListener('click', saveChanges);
new_captcha_button.addEventListener('click', captcha_new);
new_autofill_button.addEventListener('click', autofill_new);
new_autocheck_button.addEventListener('click', autocheck_new);
new_checkall_button.addEventListener('click', checkall_new);

ocr_captcha_use_public_server.addEventListener('change', checkUsePublicServer);

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
                if (item["maxlength"] == "" || item["maxlength"] == "0" ) {
                    item["maxlength"] = 0;
                }
                captcha.push(item);
            }
        }
    }
    return captcha;
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

async function saveChanges() {
    const silent_flag = false;

    if (settings) {

        let remote_url_array = [];
        remote_url_array.push(remote_url.value);
        let remote_url_string = JSON.stringify(remote_url_array);
        remote_url_string = remote_url_string.substring(0, remote_url_string.length - 1);
        remote_url_string = remote_url_string.substring(1);
        //console.log("final remote_url_string:"+remote_url_string);

        settings.advanced.remote_url = remote_url_string;

        settings.ocr_captcha.enable = ocr_captcha_enable.checked;
        settings.ocr_captcha.captcha = get_captcha_array();
        settings.autofill = get_autofill_array();
        settings.autocheck = get_autocheck_array();
        settings.checkall = get_checkall_array();

        await storage.set({
            settings: settings
        });

    }
    if (!silent_flag) {
        message('已存檔');
    }

}

function loadChanges() {
    storage.get('settings', function(items) {
        //console.log(items);
        if (items.settings) {
            settings = items.settings;

            let remote_url_string = "";
            let remote_url_array = [];
            if (settings.advanced.remote_url.length > 0) {
                remote_url_array = JSON.parse('[' + settings.advanced.remote_url + ']');
            }
            if (remote_url_array.length) {
                remote_url_string = remote_url_array[0];
            }
            remote_url.value = remote_url_string;

            ocr_captcha_enable.checked = settings.ocr_captcha.enable;

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

            if (settings.checkall.length) {
                settings.checkall.forEach((d) => {
                    checkall_new_with_value(d);
                });
            }

            initai_captcha();
            initai_autofill();
            initai_autocheck();
            initai_checkall();
        } else {
            console.log('no settings found');
        }

    });
}

async function checkUsePublicServer() {
    remote_url.value = PUBLIC_SERVER_URL;
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