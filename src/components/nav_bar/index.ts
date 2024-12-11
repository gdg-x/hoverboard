import { customElement } from "@polymer/decorators";
import { html, PolymerElement } from "@polymer/polymer";

@customElement('navBar')
export class navBar extends PolymerElement {
    static get template() {
        return html`
            <div class="container">
                <div class="icon">
                    <p>Icon</p>
                </div>
                <div class="button_container">
                    <a></a>
                </div>
            </div>
        `
    }
}