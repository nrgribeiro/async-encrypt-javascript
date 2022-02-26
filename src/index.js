import { default as axios } from "axios";
import { pki, util, random, cipher } from "node-forge";
const BASE_URL = "http://127.0.0.1:8000";

const handshake = async () => {
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

const sendEncryptedData = async ({ decryptedSharedKey, handshakeId, data }) => {
  // generate a random 16 byte IV
  const iv = random.getBytesSync(16);

  // encrypt the data using the random IV and the shared key
  const encryption = cipher.createCipher("AES-CBC", decryptedSharedKey);
  encryption.start({ iv });
  encryption.update(util.createBuffer(data, "utf8"));
  encryption.finish();

  // send the encrypted data and handshake id to the server
  const response = await axios
    .post(`${BASE_URL}/api/account/update`, {
      handshakeId,
      encryptedData: util.encode64(iv + encryption.output.data),
    })
    .then((result) => result.data)
    .catch((error) => error);

  //console.log("server response", response);
};

window.onload = handshake;
