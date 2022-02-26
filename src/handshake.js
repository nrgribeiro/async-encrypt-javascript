import { default as axios } from "axios";
import { pki, util } from "node-forge";
import { BASE_URL } from ".";
import { sendEncryptedData } from "./sendData";

export const handshake = async () => {
  // generate public/private key pair
  let keypair;
  await pki.rsa.generateKeyPair({ bits: 2048, workers: 2 }, (err, k) => {
    keypair = k;
  });

  // convert public key to PEM format
  const publicKey = pki.publicKeyToPem(keypair.publicKey);

  // send the PEM formated public key to server and
  // save the encrypted shared key and handshake id
  const { encryptedKey, handshakeId } = await axios
    .post(`${BASE_URL}/api/handshake`, {
      publicKey,
    })
    .then((result) => result.data)
    .catch((error) => error);

  // base 64 decode the shared key and decrypt it using the private key
  const sharedKey = util.decode64(encryptedKey);
  const decryptedSharedKey = keypair.privateKey.decrypt(sharedKey);

  // just some data we need to encrypt and send to server
  const data = "something123";

  sendEncryptedData({ decryptedSharedKey, handshakeId, data });
};
