import '@polymer/polymer';
import { flex, flexAlignment, flexReverse, positioning } from '../styles/layout';

const documentContainer = document.createElement('template');

documentContainer.innerHTML = `<dom-module id="flex">
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
</dom-module><dom-module id="flex-alignment">
  <template>
    <style>
    ${flexAlignment}
    </style>
  </template>
</dom-module><dom-module id="positioning">
  <template>
    <style>
    ${positioning}
    </style>
  </template>
</dom-module>`;

document.head.appendChild(documentContainer.content);
