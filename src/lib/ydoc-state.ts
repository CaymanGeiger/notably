import * as Y from "yjs";

export const noteContentFragmentName = "note-content";

export function encodeYDocStateToBase64(yDoc: Y.Doc): string {
  let binary = "";

  for (const byte of Y.encodeStateAsUpdate(yDoc)) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

export function decodeBase64ToYDocState(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}
