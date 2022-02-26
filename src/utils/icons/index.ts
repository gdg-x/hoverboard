import '@polymer/iron-iconset-svg/iron-iconset-svg';
import { html } from '@polymer/polymer/lib/utils/html-tag';
import { account } from './account';
import { achievement } from './achievement';
import { addCircleOutline } from './add-circle-outline';
import { arrowLeft } from './arrow-left';
import { arrowRightCircle } from './arrow-right-circle';
import { bell } from './bell';
import { bellOff } from './bell-off';
import { bellOutline } from './bell-outline';
import { bookmarkCheck } from './bookmark-check';
import { bookmarkPlus } from './bookmark-plus';
import { calendar } from './calendar';
import { checked } from './checked';
import { chevronLeft } from './chevron-left';
import { chevronRight } from './chevron-right';
import { close } from './close';
import { coffeeBreak } from './coffee-break';
import { directions } from './directions';
import { document } from './document';
import { facebook } from './facebook';
import { filterList } from './filter-list';
import { gde } from './gde';
import { gdg } from './gdg';
import { github } from './github';
import { google } from './google';
import { insertComment } from './insert-comment';
import { instagram } from './instagram';
import { linkedin } from './linkedin';
import { location } from './location';
import { lunch } from './lunch';
import { meetup } from './meetup';
import { menu } from './menu';
import { microphone } from './microphone';
import { openInNew } from './open-in-new';
import { opening } from './opening';
import { party } from './party';
import { people } from './people';
import { play } from './play';
import { presentation } from './presentation';
import { registration } from './registration';
import { ticket } from './ticket';
import { tracks } from './tracks';
import { twitter } from './twitter';
import { up } from './up';
import { video } from './video';
import { website } from './website';
import { work } from './work';
import { wtm } from './wtm';
import { youtube } from './youtube';

// prettier-ignore
const template = html`
  <iron-iconset-svg name="hoverboard" size="24">
    <svg>
      <defs>
        ${account}
        ${achievement}
        ${addCircleOutline}
        ${arrowLeft}
        ${arrowRightCircle}
        ${bell}
        ${bellOff}
        ${bellOutline}
        ${bookmarkCheck}
        ${bookmarkPlus}
        ${calendar}
        ${checked}
        ${chevronLeft}
        ${chevronRight}
        ${close}
        ${coffeeBreak}
        ${directions}
        ${document}
        ${facebook}
        ${filterList}
        ${gde}
        ${gdg}
        ${github}
        ${google}
        ${insertComment}
        ${instagram}
        ${linkedin}
        ${location}
        ${lunch}
        ${meetup}
        ${menu}
        ${microphone}
        ${opening}
        ${openInNew}
        ${party}
        ${people}
        ${play}
        ${presentation}
        ${registration}
        ${ticket}
        ${tracks}
        ${twitter}
        ${up}
        ${video}
        ${website}
        ${work}
        ${wtm}
        ${youtube}
      </defs>
    </svg>
  </iron-iconset-svg>
`;

window.document.head.appendChild(template.content);
