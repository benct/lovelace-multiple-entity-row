import { version } from '../package.json';
import MultipleEntityRow from './main';
import MultipleEntityRowEditor from './editor';

const ELEMENT_NAME = 'multiple-entity-row';
const EDITOR_NAME = 'multiple-entity-row-editor';

(function earlyRegisterCustomCard() {
  const w = window as any;
  w.customCards = w.customCards || [];
  if (!w.customCards.find((c: any) => c.type === ELEMENT_NAME)) {
    w.customCards.push({
      type: ELEMENT_NAME,
      name: 'Multiple Entity Row',
      description:
        'Show multiple entity states, attributes and icons on a single entity row',
      documentationURL: 'https://github.com/duczz/ha-multiple-entity-row',
    });
  }
})();

if (!customElements.get(ELEMENT_NAME)) {
  customElements.define(ELEMENT_NAME, MultipleEntityRow);

  console.info(
    `%c MULTIPLE-ENTITY-ROW %c v${version} `,
    'color: cyan; background: black; font-weight: bold; padding: 2px 6px; border-radius: 3px 0 0 3px;',
    'color: darkblue; background: white; font-weight: bold; padding: 2px 6px; border-radius: 0 3px 3px 0;',
  );
}

if (!customElements.get(EDITOR_NAME)) {
  customElements.define(EDITOR_NAME, MultipleEntityRowEditor);
}
