var settings = null;
var ocrInterval = null;
var ocr_config = {
    captcha_length: 4,
    captcha_selector: "",
    captcha_renew_selector: "",
    input_selector: "",
    submit_selector: ""
};

function get_ocr_image(captcha_selector) {
    //console.log("get_ocr_image: " + captcha_selector);
    let image_data = "";
    let img = document.querySelector(captcha_selector);
    if (img != null) {
        let canvas = document.createElement('canvas');
        let context = canvas.getContext('2d');
        canvas.height = img.naturalHeight;
        canvas.width = img.naturalWidth;
        context.drawImage(img, 0, 0);
        let img_data = canvas.toDataURL();
        if (img_data) {
            image_data = img_data.split(",")[1];
            //console.log(image_data);
        }
    }
    return image_data;
}

var last_captcha_answer = "";
chrome.runtime.onMessage.addListener((message) => {
    //console.log('sent from background', message);
    if (message && message.hasOwnProperty("answer")) {
        let is_valid_anwser = false;
        if (ocr_config.captcha_length > 0) {
            if (message.answer.length == ocr_config.captcha_length) {
                is_valid_anwser = true;
            }
        } else {
            is_valid_anwser = true;
        }
        if (is_valid_anwser) {
            set_ocr_answer(message.answer);
            last_captcha_answer = message.answer;
        } else {
            // renew captcha.
            if (last_captcha_answer != message.answer) {
                last_captcha_answer = message.answer;
                console.log("renew captcha: " + ocr_config.captcha_renew_selector);
                if ($(ocr_config.captcha_renew_selector).length) {
                    $(ocr_config.captcha_renew_selector).click();
                }
            }
        }
    }
});

function javascript_keypress(selector, text) {
    $(selector).click();
    $(selector).val(text);
    let up = $.Event('keyup');
    up.key = text;
    $(selector).trigger(up);
}

function set_ocr_answer(answer) {
    //console.log("answer:"+answer);
    const current_inputed_value = $(ocr_config.input_selector).val();
    if (answer.length > 0) {
        if (current_inputed_value != answer) {
            let sendkey_by_webdriver = false;
            if (settings) {
                if (settings.hasOwnProperty("token")) {
                    sendkey_by_webdriver = true;
                }
            }
            //console.log("sendkey_by_webdriver: " + sendkey_by_webdriver);
            //console.log(settings);
            if (!sendkey_by_webdriver) {
                javascript_keypress(ocr_config.input_selector, answer);
            } else {
                webdriver_location_sendkey(settings, ocr_config.input_selector, answer, document.location.href);
            }
        }
    }
}

async function get_ocr_answer(api_url, image_data) {
    let bundle = {
        action: 'ocr',
        data: {
            'url': api_url + 'ocr',
            'image_data': image_data,
        }
    };

    const return_answer = await chrome.runtime.sendMessage(bundle);
    //console.log(return_answer);
}

function orc_image_ready(api_url) {
    let ret = false;
    let image_data = get_ocr_image(ocr_config.captcha_selector);
    if (image_data.length > 0) {
        ret = true;
        if (ocrInterval) clearInterval(ocrInterval);
        get_ocr_answer(api_url, image_data);
    }
    //console.log("orc_image_ready:" + ret);
    return ret;
}

function ocr_main(settings) {
    //console.log("ocr main");
    if (settings) {
        let remote_url_string = get_remote_url(settings);

        if (settings.ocr_captcha.enable && settings.ocr_captcha.captcha.length) {
            settings.ocr_captcha.captcha.forEach((d) => {
                //console.log(d);
                let is_match_url = false;
                if (d.enable) {
                    if (d.url == "") {
                        is_match_url = false;
                    } else {
                        if (wildcardMatchRegExp(document.location.href, d.url)) {
                            is_match_url = true;
                        }
                    }
                }
                //console.log(document.location.href);
                //console.log(is_match_url);
                if (is_match_url && d.captcha.length && d.input.length) {
                    // assign to global var.
                    if (d.maxlength.length > 0) {
                        ocr_config.captcha_length = parseInt(d.maxlength);
                    }
                    ocr_config.captcha_selector = d.captcha;
                    ocr_config.captcha_renew_selector = d.captcha_renew;
                    ocr_config.input_selector = d.input;

                    if ($(ocr_config.input_selector).length) {
                        let current_inputed_value = $(ocr_config.input_selector).val();
                        //console.log("current_inputed_value: " + current_inputed_value);
                        if (d.captcha.length > 3) {
                            if (current_inputed_value == "驗證碼") {
                                current_inputed_value = "";
                                $(ocr_config.input_selector).val("");
                            }
                        }
                        if (current_inputed_value == "") {
                            if (!orc_image_ready(remote_url_string)) {
                                ocrInterval = setInterval(() => {
                                    orc_image_ready(remote_url_string);
                                }, 100);
                            }
                        }
                    } else {
                        //console.log("input selector not found: " + ocr_config.input_selector);
                    }
                }
            });
        }

        if (settings.autofill.length) {
            settings.autofill.forEach((d) => {
                //console.log(d);
                let is_match_url = false;
                if (d.enable) {
                    if (d.url == "") {
                        is_match_url = false;
                    } else {
                        if (wildcardMatchRegExp(document.location.href, d.url)) {
                            is_match_url = true;
                        }
                    }
                }
                //console.log(is_match_url);
                if (is_match_url && d.selector.length && d.value.length) {
                    $(d.selector).click();
                    $(d.selector).val(d.value);
                    let up = $.Event('keyup');
                    up.key = d.value;
                    $(d.selector).trigger(up);
                }
            });
        }

        if (settings.autocheck.length) {
            settings.autocheck.forEach((d) => {
                //console.log(d);
                let is_match_url = false;
                if (d.enable) {
                    if (d.url == "") {
                        is_match_url = false;
                    } else {
                        if (wildcardMatchRegExp(document.location.href, d.url)) {
                            is_match_url = true;
                        }
                    }
                }
                //console.log(is_match_url);
                if (is_match_url && d.selector.length) {
                    $(d.selector).prop("checked", d.value);
                }
            });
        }
    }
}

function checkall() {
    $('input[type=checkbox]:not(:checked)').each(function() {
        $(this).click();
    });
}

function checkall_main(settings) {
    if (settings) {
        settings.checkall.forEach((d) => {
            //console.log(d);
            let is_match_url = false;
            if (d.enable) {
                if (d.url == "") {
                    is_match_url = false;
                } else {
                    is_match_url = wildcardMatchRegExp(document.location.href, d.url);
                }
            }
            //console.log(d.url);
            //console.log(is_match_url);
            if (is_match_url) {
                checkall();
            }
        });
    }
}

function wildcardMatchRegExp(text, pattern) {
    const regexPattern = new RegExp(
        "^" +
        pattern
        .replace(/\?/g, ".")
        .replace(/\*/g, ".*") +
        "$"
    );
    return regexPattern.test(text);
}

function run_injectjs(settings) {
    settings.injectjs.forEach((d) => {
        //console.log(d);
        let is_match_url = false;
        if (d.enable) {
            if (d.url == "") {
                is_match_url = false;
            } else {
                is_match_url = wildcardMatchRegExp(document.location.href, d.url);
            }
        }
        //console.log(d.url);
        //console.log(is_match_url);
        if (is_match_url && d.script.length) {
            // Error handling response: EvalError: Refused to evaluate a string as JavaScript because 'unsafe-eval' is not an allowed source of script in the following Content Security Policy
            // eval(d.script);
            webdriver_location_eval(settings, d.script, document.location.href);
        }
    });
}

console.log('start ocr.js');

chrome.storage.local.get('settings', function(items) {
    if (items.settings) {
        settings = items.settings;
        if (settings) {
            // generate js to chrome extension to fix unsafe-eval.
            // run_injectjs(settings);
        }
    }
});

var inputInterval = setInterval(() => {
    chrome.storage.local.get('status', function(items) {
        if (items.status && items.status == 'ON') {
            ocr_main(settings);
            checkall_main(settings);
        } else {
            //console.log('maxbot status is not OFF');
        }
    });
}, 100);