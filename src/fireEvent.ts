import { LooseObject } from './types';

export interface HAEvent extends Event {
  detail?: string | LooseObject;
}

export default function fireEvent(
  node: EventTarget,
  type: string,
  detail: string | LooseObject = {},
  options: LooseObject = {},
): HAEvent {
  const event = new Event(type, {
    bubbles: options.bubbles ?? true,
    cancelable: Boolean(options.cancelable),
    composed: options.composed ?? true,
  }) as HAEvent;
  event.detail = detail;
  node.dispatchEvent(event);
  return event;
}
