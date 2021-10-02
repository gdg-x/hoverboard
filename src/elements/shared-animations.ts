/* Bouncing animations*/

import '@polymer/polymer';

const documentContainer = document.createElement('template');

documentContainer.innerHTML = `<dom-module id="fade-animations">
    <template>
        <style>
            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translate3d(0, 100%, 0);
                }
                to {
                    opacity: 1;
                    transform: none;
                }
            }

            @keyframes fadeInAttendeesCount {
                from {
                    opacity: 0;
                    transform: translate3d(200px, 170px, 0);
                }
                to {
                    transform: translate3d(0, 0, 0);
                }
            }

            @keyframes fadeInSessionsCount {
                from {
                    opacity: 0;
                    transform: translate3d(200px, -170px, 0px);
                }
                to {
                    transform: translate3d(0, 0, 0);
                }
            }

            @keyframes fadeInTracksCount {
                from {
                    opacity: 0;
                    transform: translate3d(180px, -170px, 0px);
                }
                to {
                    transform: translate3d(0, 0, 0);
                }
            }

            @keyframes fadeInDaysCount {
                from {
                    opacity: 0;
                    transform: translate3d(180px, 170px, 0px);
                }
                to {
                    transform: translate3d(0, 0, 0);
                }
            }
        </style>
    </template>
</dom-module><dom-module id="scale-animations">
    <template>
        <style>
            @keyframes grow {
                from {
                    transform: scale(0);
                }
                to {
                    transform: scale(1);
                }
            }
        </style>
    </template>
</dom-module>`;

document.head.appendChild(documentContainer.content);
