import '@polymer/polymer';
import { theme } from '../styles/theme';
import './flex-layout-attr';

const documentContainer = document.createElement('template');

documentContainer.innerHTML = `<dom-module id="shared-styles">
  <template>
    <style>
      ${theme}
    </style>
  </template>
</dom-module>`;

document.head.appendChild(documentContainer.content);
