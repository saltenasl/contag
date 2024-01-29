# Firebase cloud storage security rules

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{filename} {
      allow read: if
      	request.auth != null &&
        request.auth.token.email_verified == true &&
      	firestore.exists(/databases/(default)/documents/attachments/$(filename)/read/$(request.auth.token.email))

      allow write: if
      	request.auth != null &&
        request.auth.token.email_verified == true &&
        resource == null && // this makes sure it is impossible to overwrite existing files
        request.resource.size < 5 * 1024 * 1024 &&
      	firestore.exists(/databases/(default)/documents/attachments/$(filename)/write/$(request.auth.token.email))
    }

    match /{allPaths=**} {
      allow read, write: if false
    }
  }
}
```

## Purpose of the rules

Rules make sure:

- only authenticated users with verified email address can upload files
- files cannot be overwritten
- checks firestore whether user has access to read or write this specific filename given users email

## Deployment

Rules are updated manually via firebase console.
