# Credentials format

## Algorithmia

File: `algorithmia.ts`

```
export const api = {
    "key": "sim9c6vZgeNmqVM7cjRfbha8e5c1"
}
```

## Watson Natural Language Understanding

File: `watson-nlu.ts`

```
export const api = {
    "apikey": "1c4FGjmP1GFsH1kzt3rNB8sXOKEhwgwMLnHwqT6-OlJM",
    "iam_apikey_description": "Auto-generated for key 468da576-790c-4873-ac5e-9014a8aee939",
    "iam_apikey_name": "Auto-generated service credentials",
    "iam_role_crn": "crn:v1:bluemix:public:iam::::serviceRole:Manager",
    "iam_serviceid_crn": "crn:v1:bluemix:public:iam-identity::a/3aee8de023374b53b1e765b7334d1f4f::serviceid:ServiceId-f8888bc8-66a6-425b-9670-0d1d48570566",
    "url": "https://api.us-south.natural-language-understanding.watson.cloud.ibm.com/instances/d9022398-5f2b-4e60-aefd-277ae158fed3"
}
```

## Google Search credentials

File: `google-search.ts`

```
export const api = {
    "apiKey": "AIzaSyAxFXRpPS3_y-SFH2NgC6V14Xnsxq9Ei-k",
    "searchEngineId": "447c28d60d045149b"
}
```

## Youtube credentials

File: `youtube.ts`

```
export const api = {
    "web": {
        "client_id": "53929984792-1dc1cc4ngermdmv3jcn5otcb59miqr0c.apps.googleusercontent.com",
        "project_id": "content-maker-upload",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_secret": "Hl1VJilEGPtFeZZw_MY8P811",
        "redirect_uris": [
            "http://localhost:5000/oauth2callback"
        ],
        "javascript_origins": [
            "http://localhost:5000"
        ]
    }
}
```