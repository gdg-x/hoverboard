import admin from 'firebase-admin';
const serviceAccount = {
  "type": "service_account",
  "project_id": "hoverboard-dev",
  "private_key_id": "8768cbf582e95bc18a18063f239e0e44db3fe0ce",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCPoGbHHy0YD3cm\nYpjCM71KEI9prm7ufFavP8X+D9dDeGglRZJ6NFmNVmPfwosGGYUuOvclxJe1ioFY\nnjs+vx93CKUTdEbFfHf6ztt8xSxClgooPLzla32M+ozVU6kJAEAWtfnzqp4PwjzB\ndAvcEe05P5g0r6UShBLS/A2eemO2QvSKt3hMqmzVBlylau8Jkp298Hf49EiPM7Fu\nCnZf3nQOcxTgqqndaB88yzQrBXEM9sk8g+ZzbHrD/9VsfKLNNxYJ+/0bhU/CUNe7\n7rXOZLzz7837teHU3x5SOHo8fyjtSKk+2Q+zM20i3VubgvZCkNb49jIxaiZZeCgG\nJmFLfc79AgMBAAECggEAA573YF9Gl4PyTM8xCzpbNBYRS4iIhu4vEEmDEBntoyeS\ntpfXrsmJlXDfYTmKIDv9+dGmP/dCHONSSf3pP/Z5EFrxMHmevCVccAANlApziHU4\nadXILF+GoYqCiPFMQmwVcY0icVR0mjCbMARhNSnliWszRubDumEGiXetzzhGMcba\nLzxvpJZzzTFiMVy1sRZF9IGCHvA1BksoX4kqt5mBoDj0z9opprXF7W2dspBPFT8G\ng4NdU04W34crUWam6tQp5T6NF8nJL5kDUDQbfNOJGqTRKgmUEamrp7X5h3DTm38L\ndnmjTG/QakD9HifNymDgi7OTLPAMqwQWGT6R9Y/M8QKBgQDGqKK/NRPm63q+jWTU\nzxUcwN76x95DATus6PgfGtjm6G+mHc+911OMYm3V0sREovg5w4wFSpROKGsUd9Du\n3+nfBzt4QJsRrRedAtXO4u8J0NupgXIF10P0OxM4tvxaT3XhQhAWXdwJR37740XM\nhhWTmYwvdd/BnTe3bZALTfQk0QKBgQC5FU8JvB6nvoVSSj1UjmVToBI0kmBcKoH3\nUeV8OGXtkDZTQA0BgLBEbApg6YKTA8F5RXgx70I0BtT2KrX1ATzVfXkT96Lvbhb2\ncDXOuHsYPxiqXlaXMtRngP0DBCiCGnzpc5Hjl2fqBk1Pxvhqqq0WlTLLJVR1OfJB\nNeck+FiCbQKBgQCSsCK8HW08rdRMsAssOFzWhnQfqUWtJFP0MXJFRYWzux32Az1K\naJ0ApA2GPcM/CzdPL91Mau1naODolDBqslv2m1iGSu419yHghh9qTJdFIDuSxkpz\nlahPxu9CiZt88/+O/UDzwwqer3RMel0n0DpOaqrgwKEgTf6+KuCZ+E22gQKBgCZi\nnPnP4iu3/76JVx7qSWmGkUAF+6YhysKYYZfZuooClsG9TvU401XdcmmXBFWpOb8F\nAWCZ1okjwZcsVIBzuUItu6bAfTJbCrghnYc6C42DyIHM/vhsulCdF9xASIZzJ+Ti\n6ybgh9Spae9ZvLuimjNMzjQDkfieA/gyTbYFK5YhAoGADIsQaB20Qyc9kF37DD/B\n0l+kEU6XOaTRHjDEoz3O5ePVKcm4frUUQNiAdHbDxzKmtf+qeTzBQvkf1spEi5Qx\n15k4S0h8qfUJMOhyoHxceq+nCQPs7rEPwoUP2Z3nGEJGUUnn/5SpvAtYqZw7iVmy\nXA5Hfr4YH7GvqLD4pRC1vDg=\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-oppda@hoverboard-dev.iam.gserviceaccount.com",
  "client_id": "109179492540555731560",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-oppda%40hoverboard-dev.iam.gserviceaccount.com"
}


let firestore = null;
export function initializeFirebase() {
  return new Promise((resolve) => {

    const firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    firestore = admin.firestore();
    resolve(firebaseApp);
  });
}

export {
  firestore,
}
