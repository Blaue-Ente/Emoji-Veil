---
name: Emoji Encrypt port setup quirk
description: The artifact workflow port detection fails for emoji-encrypt; workaround is a console-type custom workflow on port 5000.
---

## Rule
The `artifacts/emoji-encrypt: web` artifact workflow will always fail `restart_workflow` with "didn't open port X" regardless of which port is used. This is because the artifact was created without a `[[ports]]` entry ever being written to `.replit` — the `createArtifact` call for this slug encountered a service path conflict that prevented port allocation.

**Why:** The Replit workflow verification for artifact workflows checks if the local port is open via a mechanism that requires a `[[ports]]` entry in `.replit`. Since no entry exists for emoji-encrypt's port, verification always fails. However, the proxy routing IS configured (verifyAndReplaceArtifactToml updates internal proxy state) and the app IS accessible at the public URL.

**How to apply:** Run the app via the "Emoji Encrypt Dev" custom workflow (`outputType: "console"`, no `waitForPort`, port 5000, BASE_PATH=/). This bypasses port verification and keeps the process alive. The artifact proxy routing correctly maps "/" to port 5000.

If the workspace is recreated or the workflow disappears, recreate it with:
```javascript
await configureWorkflow({
    name: "Emoji Encrypt Dev",
    command: "PORT=5000 BASE_PATH=/ pnpm --filter @workspace/emoji-encrypt run dev",
    outputType: "console",
    autoStart: true
});
```
