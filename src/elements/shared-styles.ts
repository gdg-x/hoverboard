import '@polymer/polymer';
import { html } from '@polymer/polymer';
import { theme } from '../styles/theme';
import './flex-layout-attr';

const template = html`
  <dom-module id="shared-styles">
    <template>
      <style>
        ${theme}
      </style>
    </template>
  </dom-module>
`;

document.head.appendChild(template.content);
