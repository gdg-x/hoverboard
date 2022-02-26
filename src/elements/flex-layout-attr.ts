import '@polymer/polymer';
import { html } from '@polymer/polymer';
import { flex, flexAlignment, flexFactors, flexReverse, positioning } from '../styles/layout';

const template = html`
  <dom-module id="flex">
    <template>
      <style>
        ${flex}
      </style>
    </template>
  </dom-module>

  <dom-module id="flex-reverse">
    <template>
      <style>
        ${flexReverse}
      </style>
    </template>
  </dom-module>

  <dom-module id="flex-alignment">
    <template>
      <style>
        ${flexAlignment}
      </style>
    </template>
  </dom-module>

  <dom-module id="flex-factors">
    <template>
      <style>
        ${flexFactors}
      </style>
    </template>
  </dom-module>

  <dom-module id="positioning">
    <template>
      <style>
        ${positioning}
      </style>
    </template>
  </dom-module>
`;

document.head.appendChild(template.content);
