#!/usr/bin/env python3
#encoding=utf-8
import asyncio
import base64
import json
import logging
import os
import platform
import shutil
import ssl
import subprocess
import sys
import threading
import time
import warnings
import webbrowser
from datetime import datetime
from typing import (Any, Awaitable, Callable, Dict, Generator, Iterable, List,
                    Optional, Tuple, Type, TypeVar, Union, cast, overload)

import tornado
from tornado.web import Application, StaticFileHandler
from urllib3.exceptions import InsecureRequestWarning

import util

try:
    import ddddocr
except Exception as exc:
    pass

CONST_APP_VERSION = "DDDDEXT (2024.05.05)"

CONST_MAXBOT_CONFIG_FILE = "settings.json"
CONST_DDDDEXT_EXTENSION_NAME = "ddddextplus_1.0.0"
CONST_SERVER_PORT = 16888
CONST_SOUND_FILENAME_DEFAULT = "sound_ding-dong.wav"
CONST_HOMEPAGE_DEFAULT = "about:blank"

warnings.simplefilter('ignore',InsecureRequestWarning)
ssl._create_default_https_context = ssl._create_unverified_context
logging.basicConfig()
logger = logging.getLogger('logger')

translate={}

def get_default_config():
    config_dict={}

    config_dict["homepage"] = CONST_HOMEPAGE_DEFAULT
    config_dict["refresh_datetime"] = ""
    config_dict["memo"] = ""

    config_dict["ocr_captcha"] = {}
    config_dict["ocr_captcha"]["enable"] = True
    config_dict["ocr_captcha"]["beta"] = True
    config_dict["ocr_captcha"]["force_submit"] = True
    config_dict["ocr_captcha"]['captcha']=[]

    config_dict['advanced']={}

    config_dict["advanced"]["chrome_extension"] = True
    config_dict["advanced"]["adblock"] = True
    config_dict["advanced"]["hide_some_image"] = False
    config_dict["advanced"]["block_facebook_network"] = False

    config_dict["advanced"]["play_sound_filename"] = CONST_SOUND_FILENAME_DEFAULT

    config_dict["advanced"]["headless"] = False
    config_dict["advanced"]["verbose"] = False

    # remote_url not under ocr, due to not only support ocr features.
    config_dict["advanced"]["remote_url"] = "\"http://127.0.0.1:%d/\"" % (CONST_SERVER_PORT)

    config_dict["advanced"]["proxy_server_port"] = ""
    config_dict["advanced"]["window_size"] = "480,1024"

    config_dict['autofill']=[]
    config_dict['autocheck']=[]
    config_dict['injectjs']=[]
    config_dict['cookie']=[]
    config_dict['checkall']=[]

    return config_dict

def load_json():
    app_root = util.get_app_root()

    # overwrite config path.
    config_filepath = os.path.join(app_root, CONST_MAXBOT_CONFIG_FILE)

    config_dict = None
    if os.path.isfile(config_filepath):
        try:
            with open(config_filepath) as json_data:
                config_dict = json.load(json_data)
        except Exception as e:
            pass
    else:
        config_dict = get_default_config()
    return config_filepath, config_dict

def reset_json():
    app_root = util.get_app_root()
    config_filepath = os.path.join(app_root, CONST_MAXBOT_CONFIG_FILE)
    if os.path.exists(str(config_filepath)):
        try:
            os.unlink(str(config_filepath))
        except Exception as exc:
            print(exc)
            pass

    config_dict = get_default_config()
    return config_filepath, config_dict

def launch_maxbot():
    global launch_counter
    if "launch_counter" in globals():
        launch_counter += 1
    else:
        launch_counter = 0

    script_name = "nodriver_ddddext"
    config_filepath, config_dict = load_json()

    window_size = config_dict["advanced"]["window_size"]
    if len(window_size) > 0:
        if "," in window_size:
            size_array = window_size.split(",")
            target_width = int(size_array[0])
            target_left = target_width * launch_counter
            #print("target_left:", target_left)
            if target_left >= 1440:
                launch_counter = 0
            window_size = window_size + "," + str(launch_counter)
            #print("window_size:", window_size)

    threading.Thread(target=util.launch_maxbot, args=(script_name,"","","","",window_size,)).start()

def clean_tmp_file():
    Root_Dir = util.get_app_root()
    target_folder_list = os.listdir(Root_Dir)
    for item in target_folder_list:
        if item.endswith(".tmp"):
            os.remove(os.path.join(Root_Dir, item))

    # clean generated javascript.
    webdriver_folder = os.path.join(Root_Dir, "webdriver")
    extension_folder = os.path.join(webdriver_folder, CONST_DDDDEXT_EXTENSION_NAME)
    js_folder = os.path.join(extension_folder, "js")
    js_folder_list = os.listdir(js_folder)
    for item in js_folder_list:
        if item.startswith("tmp_"):
            os.remove(os.path.join(js_folder, item))

    # clean generated ext.
    target_folder_list = os.listdir(webdriver_folder)
    for item in target_folder_list:
        if item.startswith("tmp_"):
            try:
                shutil.rmtree(os.path.join(webdriver_folder, item))
            except Exception as exc:
                print(exc)
                pass

class HomepageHandler(tornado.web.RequestHandler):
    def get(self):
        Root_Dir = util.get_app_root()
        web_folder = os.path.join(Root_Dir, "www")
        html_path = os.path.join(web_folder, "settings.html")
        if os.path.exists(html_path):
            self.render(html_path)

class VersionHandler(tornado.web.RequestHandler):
    def get(self):
        self.write({"version":self.application.version})

class ShutdownHandler(tornado.web.RequestHandler):
    def get(self):
        global GLOBAL_SERVER_SHUTDOWN
        GLOBAL_SERVER_SHUTDOWN = True
        self.write({"showdown": GLOBAL_SERVER_SHUTDOWN})

class StatusHandler(tornado.web.RequestHandler):
    def get(self):
        is_paused = False
        self.write({"status": not is_paused})

class RunHandler(tornado.web.RequestHandler):
    def get(self):
        print('run button pressed.')
        launch_maxbot()
        self.write({"run": True})

class LoadJsonHandler(tornado.web.RequestHandler):
    def get(self):
        config_filepath, config_dict = load_json()
        self.write(config_dict)

class ResetJsonHandler(tornado.web.RequestHandler):
    def get(self):
        config_filepath, config_dict = reset_json()
        util.save_json(config_dict, config_filepath)
        self.write(config_dict)

class ImportJsonHandler(tornado.web.RequestHandler):
    def post(self):
        self.set_header("Access-Control-Allow-Origin", "*")
        self.set_header("Access-Control-Allow-Headers", "x-requested-with")
        self.set_header('Access-Control-Allow-Methods', 'POST')

        config_dict = {}
        _body = None
        is_pass_check = True
        errorMessage = ""
        errorCode = 0

        if is_pass_check:
            is_pass_check = False
            try :
                _body = json.loads(self.request.body)
                is_pass_check = True
            except Exception:
                errorMessage = "wrong json format"
                errorCode = 1001
                pass

        if is_pass_check:
            app_root = util.get_app_root()
            if "url" in _body:
                try:
                    html_text = util.wget(_body["url"])
                    config_dict = json.loads(html_text)
                except Exception as exc:
                    print("load json fail:")
                    print(exc)
                    pass
        self.write(config_dict)


class SaveJsonHandler(tornado.web.RequestHandler):
    def post(self):
        _body = None
        is_pass_check = True
        error_message = ""
        error_code = 0

        if is_pass_check:
            is_pass_check = False
            try :
                _body = json.loads(self.request.body)
                is_pass_check = True
            except Exception:
                error_message = "wrong json format"
                error_code = 1002
                pass

        if is_pass_check:
            app_root = util.get_app_root()
            config_filepath = os.path.join(app_root, CONST_MAXBOT_CONFIG_FILE)
            config_dict = _body

            util.save_json(config_dict, config_filepath)

        if not is_pass_check:
            self.set_status(401)
            self.write(dict(error=dict(message=error_message,code=error_code)))

        self.finish()

class SendkeyHandler(tornado.web.RequestHandler):
    def post(self):
        #print("SendkeyHandler")
        self.set_header("Access-Control-Allow-Origin", "*")
        self.set_header("Access-Control-Allow-Headers", "x-requested-with")
        self.set_header('Access-Control-Allow-Methods', 'POST, OPTIONS')

        _body = None
        is_pass_check = True
        errorMessage = ""
        errorCode = 0

        if is_pass_check:
            is_pass_check = False
            try :
                _body = json.loads(self.request.body)
                is_pass_check = True
            except Exception:
                errorMessage = "wrong json format"
                errorCode = 1001
                pass

        if is_pass_check:
            app_root = util.get_app_root()
            if "token" in _body:
                tmp_file = _body["token"] + "_sendkey.tmp"
                config_filepath = os.path.join(app_root, tmp_file)
                #print("json:", _body)
                #print("tmp_file:", config_filepath)
                util.save_json(_body, config_filepath)

        self.write({"return": True})

class EvalHandler(tornado.web.RequestHandler):
    def post(self):
        #print("SendkeyHandler")
        self.set_header("Access-Control-Allow-Origin", "*")
        self.set_header("Access-Control-Allow-Headers", "x-requested-with")
        self.set_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')

        _body = None
        is_pass_check = True
        errorMessage = ""
        errorCode = 0

        if is_pass_check:
            is_pass_check = False
            try :
                _body = json.loads(self.request.body)
                is_pass_check = True
            except Exception:
                errorMessage = "wrong json format"
                errorCode = 1001
                pass

        if is_pass_check:
            app_root = util.get_app_root()
            if "token" in _body:
                tmp_file = _body["token"] + "_eval.tmp"
                config_filepath = os.path.join(app_root, tmp_file)
                #print("tmp_file:", config_filepath)
                util.save_json(_body, config_filepath)

        self.write({"return": True})

class PlaysoundHandler(tornado.web.RequestHandler):
    def get(self):
        config_filepath, config_dict = load_json()
        if len(config_dict["advanced"]["play_sound_filename"]) > 0:
            app_root = util.get_app_root()
            captcha_sound_filename = os.path.join(app_root, config_dict["advanced"]["play_sound_filename"])
            util.play_mp3_async(captcha_sound_filename)
        self.write({"return": True})

class OcrHandler(tornado.web.RequestHandler):
    def get(self):
        self.write({"answer": "1234"})

    def post(self):
        self.set_header("Access-Control-Allow-Origin", "*")
        self.set_header("Access-Control-Allow-Headers", "x-requested-with")
        self.set_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')

        _body = None
        is_pass_check = True
        errorMessage = ""
        errorCode = 0

        if is_pass_check:
            is_pass_check = False
            try :
                _body = json.loads(self.request.body)
                is_pass_check = True
            except Exception:
                errorMessage = "wrong json format"
                errorCode = 1001
                pass

        img_base64 = None
        image_data = ""
        if is_pass_check:
            if 'image_data' in _body:
                image_data = _body['image_data']
                if len(image_data) > 0:
                    img_base64 = base64.b64decode(image_data)
            else:
                errorMessage = "image_data not exist"
                errorCode = 1002

        #print("is_pass_check:", is_pass_check)
        #print("errorMessage:", errorMessage)
        #print("errorCode:", errorCode)
        ocr_answer = ""
        if not img_base64 is None:
            try:
                ocr_answer = self.application.ocr.classification(img_base64)
                print("ocr_answer:", ocr_answer)
            except Exception as exc:
                pass

        self.write({"answer": ocr_answer})

async def main_server():
    ocr = None
    try:
        ocr = ddddocr.DdddOcr(show_ad=False, beta=True)
    except Exception as exc:
        print(exc)
        pass

    app = Application([
        ("/", HomepageHandler),
        ("/version", VersionHandler),
        ("/shutdown", ShutdownHandler),
        ("/sendkey", SendkeyHandler),
        ("/eval", EvalHandler),
        ("/playsound", PlaysoundHandler),

        # status api
        ("/status", StatusHandler),
        ("/run", RunHandler),

        # json api
        ("/load", LoadJsonHandler),
        ("/save", SaveJsonHandler),
        ("/reset", ResetJsonHandler),
        ("/import", ImportJsonHandler),

        ("/ocr", OcrHandler),
        ('/(.*)', StaticFileHandler, {"path": os.path.join(".", 'www/')}),
    ])
    app.ocr = ocr;
    app.version = CONST_APP_VERSION;

    app.listen(CONST_SERVER_PORT)
    print("server running on port:", CONST_SERVER_PORT)

    url="http://127.0.0.1:" + str(CONST_SERVER_PORT) + "/"
    print("goto url:", url)
    webbrowser.open_new(url)
    await asyncio.Event().wait()

def web_server():
    is_port_binded = util.is_connectable(CONST_SERVER_PORT)
    #print("is_port_binded:", is_port_binded)
    if not is_port_binded:
        asyncio.run(main_server())
    else:
        print("port:", CONST_SERVER_PORT, " is in used. 已有其他程式占用 web server 的連接埠.")

if __name__ == "__main__":
    global GLOBAL_SERVER_SHUTDOWN
    GLOBAL_SERVER_SHUTDOWN = False

    threading.Thread(target=web_server, daemon=True).start()
    clean_tmp_file()

    print("maxbot app version:", CONST_APP_VERSION)
    print("python version:", platform.python_version())
    print("platform:", platform.platform())
    print("To exit web server press Ctrl + C.")

    while True:
        time.sleep(0.4)
        if GLOBAL_SERVER_SHUTDOWN:
            break
    print("Bye bye, see you next time.")
