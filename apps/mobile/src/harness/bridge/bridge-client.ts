import type { BridgeMessage } from './bridge-types';

export function postBridgeMessage<TPayload>(message: BridgeMessage<TPayload>) {
  return JSON.stringify(message);
}
