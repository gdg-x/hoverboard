/** Every element matching `selector` under `root`, including inside shadow roots. */
export const queryAllDeep = (root: ParentNode, selector: string): Element[] => [
  ...root.querySelectorAll(selector),
  ...[...root.querySelectorAll('*')].flatMap((element) =>
    element.shadowRoot ? queryAllDeep(element.shadowRoot, selector) : [],
  ),
];
