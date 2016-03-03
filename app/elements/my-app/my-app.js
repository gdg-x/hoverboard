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
      upgraded: Boolean,
      storage: {
        type: Object
      }
    };
  }
  //created() {}
  ready() {
    // Let the world know we're ready to receive data
    // https://github.com/Polymer/polymer/issues/2653
    this.fire('upgraded');
    this.upgraded = true;
  }
  attached() {
    let darkThemeEnabled = JSON.parse(localStorage.getItem('my-app-storage')).darkThemeEnabled;
    this.changeTheme(darkThemeEnabled);
  }
  //detached() {}
  //attributeChanged() {}

  // Initialize default storage if nothing has been stored
  initializeDefaultStorage() {
    this.storage = {
      darkThemeEnabled: false
    }
  }
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
  // Handle change event from darkThemeToggle
  onDarkThemeToggleChange() {
    this.changeTheme(this.$.darkThemeToggle.checked);
  }
  // Change theme
  changeTheme(darkThemeEnabled) {
    let themeMode = 'light';

    if (darkThemeEnabled) {
      themeMode = 'dark';
    }

    this.customStyle['--primary-background-color'] = this.getComputedStyleValue(`--${themeMode}-theme-primary-background-color`);
    this.customStyle['--secondary-background-color'] = this.getComputedStyleValue(`--${themeMode}-theme-secondary-background-color`);
    this.customStyle['--tertiary-background-color'] = this.getComputedStyleValue(`--${themeMode}-theme-tertiary-background-color`);
    this.customStyle['--primary-text-color'] = this.getComputedStyleValue(`--${themeMode}-theme-primary-text-color`);
    this.customStyle['--secondary-text-color'] = this.getComputedStyleValue(`--${themeMode}-theme-secondary-text-color`);
    this.customStyle['--disabled-text-color'] = this.getComputedStyleValue(`--${themeMode}-theme-disabled-text-color`);
    this.customStyle['--divider-color'] = this.getComputedStyleValue(`--${themeMode}-theme-divider-color`);

    this.customStyle['--toggle-unchecked-bar-color'] = this.getComputedStyleValue(`--${themeMode}-theme-toggle-unchecked-bar-color`);
    this.customStyle['--toggle-unchecked-button-color'] = this.getComputedStyleValue(`--${themeMode}-theme-toggle-unchecked-button-color`);
    this.customStyle['--toggle-unchecked-ink-color'] = this.getComputedStyleValue(`--${themeMode}-theme-toggle-unchecked-ink-color`);
    this.customStyle['--toggle-checked-bar-color'] = this.getComputedStyleValue(`--${themeMode}-theme-toggle-checked-bar-color`);
    this.customStyle['--toggle-checked-button-color'] = this.getComputedStyleValue(`--${themeMode}-theme-toggle-checked-button-color`);
    this.customStyle['--toggle-checked-ink-color'] = this.getComputedStyleValue(`--${themeMode}-theme-toggle-checked-ink-color`);

    this.updateStyles();
  }
}

Polymer(MyApp);
