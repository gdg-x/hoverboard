#!/usr/bin/env python

# Copyright 2017 Google Inc. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""Pub/Sub Utility module for this sample."""

import sys
sys.path.append("./lib")

import base64
from time import strftime
import httplib2
import oauth2client.contrib.appengine as gae_oauth2client
from apiclient import discovery
from google.appengine.api import memcache
from google.appengine.api import app_identity
from google.appengine.api import urlfetch

from googleapiclient.errors import HttpError

PUBSUB_SCOPES = ["https://www.googleapis.com/auth/pubsub"]

def get_client():
    """Creates Pub/Sub client and returns it."""
    credentials = gae_oauth2client.AppAssertionCredentials(scope=PUBSUB_SCOPES)
    http = httplib2.Http(memcache)
    credentials.authorize(http)

    return discovery.build('pubsub', 'v1', http=http)


def get_full_topic_name(name):
    return 'projects/{}/topics/{}'.format(get_project_id(), name)


def get_project_id():
    return app_identity.get_application_id()


def publish_to_topic(topic, msg='', create=True):
    urlfetch.set_default_fetch_deadline(180)
    pubsub = get_client()
    full_name = get_full_topic_name(topic)
    message = {"messages": [{"data": base64.b64encode(msg)}]}
    try:
        pubsub.projects().topics().publish(topic=full_name,
                                           body=message).execute()
    except HttpError as e:
        if create and e.resp.status == 404 and "Resource not found" in e.content:
            pubsub.projects().topics().create(name=full_name,
                                              body={}).execute()
            pubsub.projects().topics().publish(topic=full_name,
                                               body=message).execute()
        else:
            raise
