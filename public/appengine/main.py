# Copyright 2017 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import webapp2
import time
import json
import pubsub_utils

class PushToPubSub(webapp2.RequestHandler):
    def get(self, topic):
        pubsub_utils.publish_to_topic(topic, str(time.time()))

        self.response.headers['Content-Type'] = 'application/json'
        self.response.write(json.dumps({"status": "200"}))

app = webapp2.WSGIApplication([
    webapp2.Route(r'/publish/<topic>', handler=PushToPubSub)
], debug=True)
