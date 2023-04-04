// @ts-nocheck
import admin, { ServiceAccount } from 'firebase-admin'

if (!process.env.firebaseServiceAccount) {
  throw new Error("firebaseServiceAccount is not defined")
}
if (!process.env.firebaseServiceAccount.startsWith("{")) {
  throw new Error("firebaseServiceAccount should be a JSON string")
}

console.log(process.env.githubWebhookPayload)
if (!process.env.githubWebhookPayload || !process.env.githubWebhookPayload.startsWith("{")) {
  throw new Error("githubWebhookPayload env missing or not a JSON")
}

const serviceAccount = JSON.parse(process.env.firebaseServiceAccount)

const credential = admin.credential.cert(serviceAccount as ServiceAccount)
admin.initializeApp({ credential })

const fileContent = JSON.parse(process.env.githubWebhookPayload)

console.log(fileContent)
return
