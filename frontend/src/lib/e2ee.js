import sodium from "libsodium-wrappers";

export const initE2EE = async () => {
  await sodium.ready;
};

// Generate an asymmetric keypair for this user (for key exchange)
export const generateUserKeyPair = () => {
  const keyPair = sodium.crypto_box_keypair();
  return {
    publicKey: sodium.to_base64(keyPair.publicKey),
    privateKey: sodium.to_base64(keyPair.privateKey)
  };
};

// Generate a random symmetric key for a conversation
export const generateConversationKey = () => {
  const key = sodium.crypto_secretbox_keygen();
  return sodium.to_base64(key);
};

// Encrypt a conversation symmetric key using recipient's public key
export const encryptKeyForRecipient = (symmetricKeyBase64, recipientPublicKeyBase64) => {
  try {
    const symmetricKey = sodium.from_base64(symmetricKeyBase64);
    const recipientPublicKey = sodium.from_base64(recipientPublicKeyBase64);
    
    const encryptedKey = sodium.crypto_box_seal(symmetricKey, recipientPublicKey);
    return sodium.to_base64(encryptedKey);
  } catch (e) {
    console.error("Failed to encrypt key for recipient", e);
    return null;
  }
};

// Decrypt a conversation symmetric key using my private key
export const decryptConversationKey = (encryptedKeyBase64, myPrivateKeyBase64) => {
  try {
    const encryptedKey = sodium.from_base64(encryptedKeyBase64);
    const myPrivateKey = sodium.from_base64(myPrivateKeyBase64);
    const myPublicKey = sodium.crypto_scalarmult_base(myPrivateKey);
    
    const symmetricKey = sodium.crypto_box_seal_open(encryptedKey, myPublicKey, myPrivateKey);
    if (!symmetricKey) throw new Error("Could not decrypt conversation key");
    return sodium.to_base64(symmetricKey);
  } catch (e) {
    console.error("Failed to decrypt conversation key", e);
    return null;
  }
};

// Encrypt a message text using the conversation symmetric key
export const encryptMessageText = (text, symmetricKeyBase64) => {
  try {
    const symmetricKey = sodium.from_base64(symmetricKeyBase64);
    const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
    
    const encryptedText = sodium.crypto_secretbox_easy(text, nonce, symmetricKey);
    
    // Combine nonce and ciphertext
    const combined = new Uint8Array(nonce.length + encryptedText.length);
    combined.set(nonce);
    combined.set(encryptedText, nonce.length);
    
    return sodium.to_base64(combined);
  } catch (e) {
    console.error("Message encryption failed", e);
    return text; // fallback to plaintext for safety or throw
  }
};

// Decrypt a message text
export const decryptMessageText = (combinedBase64, symmetricKeyBase64) => {
  try {
    const combined = sodium.from_base64(combinedBase64);
    const symmetricKey = sodium.from_base64(symmetricKeyBase64);
    
    const nonce = combined.slice(0, sodium.crypto_secretbox_NONCEBYTES);
    const ciphertext = combined.slice(sodium.crypto_secretbox_NONCEBYTES);
    
    const decryptedText = sodium.crypto_secretbox_open_easy(ciphertext, nonce, symmetricKey);
    if (!decryptedText) return "🔒 Unable to decrypt this message";
    return sodium.to_string(decryptedText);
  } catch {
    return "🔒 Unable to decrypt this message";
  }
};
