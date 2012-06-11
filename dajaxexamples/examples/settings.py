# -*- coding: utf-8 -*-
from django.conf import settings as main_settings

import re

def get(key, default):
    return getattr(main_settings, key, default)

# GAME Settings


STATIC_URL_SLASH = main_settings.STATIC_URL
if "/" not in STATIC_URL_SLASH:
    STATIC_URL_SLASH = re.sub(r'/', r'\\', '/abac/')

GAME_FILES = get('GAME_FILES', main_settings.PROJECT_ROOT + STATIC_URL_SLASH + 'game_files')
CMD_CODE = get('CMD_CODE', 'game.py')