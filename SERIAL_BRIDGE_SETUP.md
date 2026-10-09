# Serial Bridge Setup - Automatic Active Device Detection

## Overview

The serial bridge is now **super simple** - no need to manually specify device IDs anymore!

✅ **One-time setup** → Authenticate your account  
✅ **Then just specify port** → bridge auto-fetches active device  
✅ **Switch devices in dashboard** → data automatically goes to active device  
✅ **No restart needed** → just change selection in UI  

## How It Works

```
1. User authenticates bridge (first time only)
   ↓
2. User selects device in dashboard (turns GREEN)
   ↓
3. Bridge fetches active device from backend
   ↓
4. Arduino data → Serial Bridge → Backend (tagged with active device)
   ↓
5. Switch device in dashboard → data flows to new device (no restart!)
```

## Getting Started (First Time)

### Step 1: Authenticate

Open terminal in `d:\cropthingy\aurdino-setup` and run setup:

```bash
python serial_bridge.py --setup
```

You'll be prompted for:
- **Email**: Your dashboard login email
- **Password**: Your dashboard password

**Note:** Credentials are stored securely in `~/.bridge_auth` (one computer only)

```
============================================================
SERIAL BRIDGE SETUP
============================================================
This will authenticate with your backend account.
Your credentials are stored securely on this machine.

Email: john@farm.com
Password: ••••••••
[AUTH] Authenticating...
[AUTH] Credentials saved to C:\Users\username\.bridge_auth
[SUCCESS] Authenticated as: john@farm.com

[NEXT] Run the bridge with:
  python serial_bridge.py --port COM3

The active device will be fetched automatically from dashboard!
```

### Step 2: Select Device in Dashboard

1. Open http://localhost:3000
2. Log in with your credentials  
3. Find your device in the dashboard (Rice, Wheat, Maize, etc.)
4. Click to select it (it turns **🟢 GREEN** = active)

### Step 3: Run Serial Bridge

Now it's simple - just specify port and baudrate:

```bash
python serial_bridge.py --port COM3
```

Or even fully automatic (auto-detects port):

```bash
python serial_bridge.py
```

That's it! The bridge will:
- ✅ Load your stored credentials
- ✅ Fetch the active device from the dashboard automatically
- ✅ Connect to Arduino on the specified port
- ✅ Stream sensor data to your active device

```
[INFO] Fetching active device from dashboard...
[INFO] Using device: user_456_RICE

[SUCCESS] Connected to COM3 at 9600 baud
[INFO] Listening on COM3...
```

## Switching Devices (No Restart!)

1. In dashboard: Click a different device → turns **🟢 GREEN**
2. Serial data automatically flows to the new device
3. **No need to restart the bridge!**

Try it:
- Terminal running: `python serial_bridge.py --port COM3`
- Dashboard: Click "Rice" → data goes to Rice
- Dashboard: Click "Wheat" → data goes to Wheat (same bridge!)
- Dashboard: Click "Maize" → data goes to Maize

## Command Reference

### Basic Usage

```bash
# Auto-detect port, use active device from dashboard
python serial_bridge.py

# Specify port
python serial_bridge.py --port COM3

# Specify port and custom backend
python serial_bridge.py --port COM3 --backend http://localhost:5000

# Custom baudrate
python serial_bridge.py --port COM3 --baudrate 9600
```

### Setup & Maintenance

```bash
# First time: authenticate
python serial_bridge.py --setup

# Clear stored credentials
python serial_bridge.py --clear-auth

# Then re-authenticate on next run
python serial_bridge.py --setup
```

## Troubleshooting

### "No credentials stored"

```bash
# First time only - run setup
python serial_bridge.py --setup

# Enter your email and password
```

### "No active device configured"

```bash
[ERROR] No active device configured
[TIP] Open dashboard and select a device first!
```

**Solution:** Log in to dashboard at http://localhost:3000 and click on a device to make it active (🟢 GREEN).

### "Failed to connect: could not open port 'COM3'"

Port doesn't exist or is in use. Find available ports:

```powershell
# Windows PowerShell
[System.IO.Ports.SerialPort]::GetPortNames()

# Output: COM3, COM4, COM11, etc.
```

Then try:
```bash
python serial_bridge.py --port COM4
```

### "Failed to get active device: 401"

Your token expired. Clear and re-authenticate:

```bash
python serial_bridge.py --clear-auth
python serial_bridge.py --setup
```

## Security

✅ **Credentials stored securely** on your machine only  
✅ **NOT stored in git or version control**  
✅ **File permissions: 0o600** (owner read/write only)  
✅ **No API keys exposed in terminal commands**  
✅ **Session-based authentication** via JWT tokens  

## What Changed from Old System?

| Feature | Before | Now |
|---------|--------|-----|
| Setup | Copy API key manually | `--setup` interactive auth |
| Terminal command | `--device-id` + `--api-key` | Just `--port COM3` |
| Device switching | Restart bridge | Click in dashboard |
| Credentials | Typed in every time | Stored once, reused |
| Device selection | Specify per run | Select in UI |
| Complexity | High (5+ params) | Low (1 param: port) |

## Example: Complete Flow

```bash
# Terminal 1: Setup (first time only)
$ cd d:\cropthingy\aurdino-setup
$ python serial_bridge.py --setup
Email: john@farm.com
Password: ••••••••
[SUCCESS] Authenticated as: john@farm.com

# Terminal 2: Run bridge (disconnect Arduino first if you want to avoid errors)
$ python serial_bridge.py --port COM3
[INFO] Fetching active device from dashboard...
[INFO] Using device: 69dff7e9791bd359f682ce3a_RICE
[SUCCESS] Connected to COM3 at 9600 baud
[INFO] Listening on COM3...
```

```
Browser Window: Dashboard at http://localhost:3000
├─ Log in as: john@farm.com
├─ Click "Rice" device → 🟢 GREEN
└─ Watch sensor data appear in real-time!

Switch devices (no restart needed):
├─ Click "Wheat" → 🟢 GREEN
├─ Same bridge terminal shows data flowing to Wheat
└─ Click "Maize" → 🟢 GREEN
```

The bridge keeps running in the background, automatically sending data to whatever device is currently active in the dashboard!

## Next Steps

1. ✅ Register/login on dashboard: http://localhost:3000
2. ✅ Run setup: `python serial_bridge.py --setup`
3. ✅ Select active device: Click device in dashboard (🟢 GREEN)
4. ✅ Start bridge: `python serial_bridge.py --port COM3`
5. ✅ Watch data flow: Check dashboard real-time updates

That's it! No complications, no API keys, no manual device ID tracking. 🎉

---

**Still having issues?** Check [QUICK_START.md](QUICK_START.md) or [SETUP_GUIDE.md](SETUP_GUIDE.md) for more details.
