# Service Account Key Instructions

To deploy using a service account, you need to:

1. Create a service account in Google Cloud Console with the following roles:
   - Cloud Run Admin
   - Firestore Admin
   - Secret Manager Admin
   - Pub/Sub Admin
   - Monitoring Admin
   - Service Account User

2. Create a key for this service account and download the JSON key file

3. Save the key file to this directory as `service-account.json`

4. Run the deployment script:
   ```bash
   ./deployment/deploy-service-account.sh
   ```

## Security Notes

- Keep the service account key secure and don't commit it to version control
- Consider rotating the key periodically
- Use the principle of least privilege for the service account
- Delete the key when it's no longer needed