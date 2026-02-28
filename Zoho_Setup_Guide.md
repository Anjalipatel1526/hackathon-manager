# Zoho Sheets Backend Setup Guide

To use the [Zoho_Backend.deluge](file:///home/admin-system/Documents/hackathon-manager/Zoho_Backend.deluge) script as your hackathon manager backend, follow these steps:

## 1. Prepare your Zoho Sheet
- Create a Zoho Sheet with two tabs: `Applications` and `Settings`.
- **Applications** tab should have headers matching your GAS sheet (e.g., `registrationId`, `status`, `remarks`, `firstName`, `email`, etc.).
- **Settings** tab should have a header `currentPhase` in cell A1 and the value (e.g., `1`) in cell A2.

## 2. Set up Zoho Flow (The Bridge)
Zoho Sheets does not host public URLs. We use **Zoho Flow** to create a Webhook that the React app can call.

1. Go to [Zoho Flow](https://flow.zoho.com/).
2. Create a new **Flow**.
3. **Trigger**: Select **Webhook**.
   - Copy the generated Webhook URL (this will be your new `VITE_API_BASE_URL`).
4. **Action**: Search for **Custom Function** (under Zoho Flow).
5. **Configure Custom Function**:
   - Give it a name (e.g., `HandleHackathonRequest`).
   - Add an argument: `payload` (Type: Map).
   - Paste the code from `Zoho_Backend.deluge`.
   - **Important**: Replace `"YOUR_WORKBOOK_ID"` in the script with your actual Zoho Sheet ID (found in the sheet's URL).
6. **Map Webhook to Function**:
   - In the Flow editor, drag the Custom Function after the Webhook.
   - Map the Webhook's "Body" or "Data" to the `payload` argument.
7. **Response**: 
   - Configure the Webhook response to return the output of the Custom Function.

## 3. Update Frontend
1. Open your `.env` file.
2. Replace `VITE_API_BASE_URL` with your Zoho Flow Webhook URL.
3. Restart your development server.

## 4. Troubleshooting
- **Workbook ID**: Ensure the ID is correct. It is the alphanumeric part of the URL when you open your sheet.
- **Criteria**: The `zoho.sheet.updateRecord` uses criteria strings. Ensure your `registrationId` column header is spelled exactly as in the script.
- **Permissions**: Ensure the Zoho account running the Flow has access to the Sheet.
