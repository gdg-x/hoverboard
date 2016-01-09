/*
@license
Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

/* global Polymer */

class MyApp {
  beforeRegister() {
    this.is = 'my-app';
    this.properties = {
      /**
       * Signal to the outside world that this element
       * has been upgraded. Set in ready
       * https://github.com/Polymer/polymer/issues/2653
       */
      upgraded: Boolean
    };
  }
  //created() {}
  ready() {
    // Let the world know we're ready to receive data
    // https://github.com/Polymer/polymer/issues/2653
    this.fire('upgraded');
    this.upgraded = true;
  }
  //attached() {}
  //detached() {}
  //attributeChanged() {}

  // Scroll page to top and expand header
  scrollPageToTop() {
    this.$.headerPanelMain.scrollToTop(true);
  }
  // Close drawer
  closeDrawer() {
    this.$.paperDrawerPanel.closeDrawer();
  }
  // Hide confirmToast after tap on OK button
  onConfirmToastTap() {
    this.$.confirmToast.hide();
  }
}

Polymer(MyApp);
