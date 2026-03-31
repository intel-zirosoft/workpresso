import { Platform } from 'react-native';

import { appConfig } from '../../shared/env/app-config';
import type { BridgeMessage } from './bridge-types';

export function parseBridgeMessage(raw: string): BridgeMessage | null {
  try {
    return JSON.parse(raw) as BridgeMessage;
  } catch {
    return null;
  }
}

type HandleBridgeMessageOptions = {
  openExternalUrl: (url: string) => Promise<void>;
  sendToWeb: (message: BridgeMessage) => void;
};

export async function handleBridgeMessage(
  raw: string,
  { openExternalUrl, sendToWeb }: HandleBridgeMessageOptions,
) {
  const message = parseBridgeMessage(raw);

  if (!message) {
    sendToWeb({
      type: 'ERROR',
      payload: { message: 'Invalid bridge message' },
    });
    return;
  }

  switch (message.type) {
    case 'BRIDGE_READY': {
      return;
    }

    case 'WEB_SESSION_STATUS': {
      return;
    }

    case 'OPEN_EXTERNAL_URL': {
      const url = typeof message.payload === 'object' && message.payload && 'url' in message.payload
        ? String((message.payload as { url?: string }).url ?? '')
        : '';

      if (!url) {
        sendToWeb({
          type: 'ERROR',
          payload: { message: 'Missing url payload' },
        });
        return;
      }

      try {
        await openExternalUrl(url);
        sendToWeb({
          type: 'EXTERNAL_URL_RESULT',
          payload: { url },
        });
      } catch (error) {
        sendToWeb({
          type: 'ERROR',
          payload: {
            message:
              error instanceof Error && error.message
                ? error.message
                : 'Failed to open external url',
          },
        });
      }
      return;
    }

    case 'GET_DEVICE_INFO': {
      sendToWeb({
        type: 'DEVICE_INFO_RESULT',
        payload: {
          deepLinkScheme: appConfig.deepLinkScheme,
          platform: Platform.OS,
          platformVersion: Platform.Version,
        },
      });
      return;
    }

    default: {
      sendToWeb({
        type: 'ERROR',
        payload: { message: `Unsupported bridge event: ${message.type}` },
      });
    }
  }
}
