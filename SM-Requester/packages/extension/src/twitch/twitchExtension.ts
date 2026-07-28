// Thin, typed wrapper around window.Twitch.ext so components don't touch the
// global directly. See: https://dev.twitch.tv/docs/extensions/reference/

declare global {
  interface Window {
    Twitch: {
      ext: {
        viewer: { sessionToken?: string; opaqueId?: string; id?: string };
        onAuthorized: (cb: (auth: { token: string; userId: string; channelId: string }) => void) => void;
        onContext: (cb: (context: Record<string, unknown>) => void) => void;
        bits: {
          getProducts: (cb: (products: unknown[]) => void) => void;
          useBits: (sku: string) => void;
          onTransactionComplete: (cb: (transaction: { transactionReceipt: string }) => void) => void;
          onTransactionCancelled: (cb: () => void) => void;
        };
      };
    };
  }
}

export function onAuthorized(cb: (auth: { token: string; userId: string; channelId: string }) => void) {
  window.Twitch.ext.onAuthorized(cb);
}

export function useBits(sku: string) {
  window.Twitch.ext.bits.useBits(sku);
}

export function onTransactionComplete(cb: (receipt: string) => void) {
  window.Twitch.ext.bits.onTransactionComplete((tx) => cb(tx.transactionReceipt));
}
