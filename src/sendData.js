import { default as axios } from "axios";
import { util, random, cipher } from "node-forge";
import { BASE_URL } from ".";

export const sendEncryptedData = async ({
  decryptedSharedKey,
  handshakeId,
  data,
}) => {
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
