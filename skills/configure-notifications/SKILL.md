---
name: configure-notifications
description: Configure session notifications (Discord/Telegram/Slack webhooks or custom commands) by writing a WorkBuddy-native notifications config file
agent_created: true
triggers: ["configure notifications", "setup notifications", "notification settings", "configure discord", "configure telegram", "configure slack", "discord webhook", "telegram bot", "slack webhook"]
---

> Ported from oh-my-codex `configure-notifications`. OMX runtime conventions (`$macro` invocation, `omx` CLI, `.omx/` state directory) are replaced with WorkBuddy idioms (Skill tool, Agent tool, task list, `.workbuddy/memory`).

# Configure Notifications

Unified entry point for notification setup in WorkBuddy.

- **Native platforms (first-class):** Discord, Telegram, Slack (via webhooks / bot tokens).
- **Generic extensibility:** `custom_webhook_command` (POST to a URL) and `custom_cli_command` (run a local command).

> WorkBuddy has no built-in session-end hook system, so this skill writes a config file
> (`.workbuddy/notifications.json` at the repo root, or `~/.workbuddy/notifications.json` for global).
> You can wire that file into your own external automation, scheduler, or shell wrapper to actually
> send the notifications. The skill only manages the configuration.

## Step 1: Inspect Current State

```bash
CONFIG_FILE=".workbuddy/notifications.json"
if [ -f "$CONFIG_FILE" ]; then
  cat "$CONFIG_FILE"
else
  echo "NO_CONFIG_FILE"
fi
```

## Step 2: Main Menu

Use AskUserQuestion:

**Question:** "What would you like to configure?"

**Options:**
1. **Discord (native)** — webhook URL or bot token + channel.
2. **Telegram (native)** — bot token + chat id.
3. **Slack (native)** — incoming webhook URL.
4. **Generic webhook command** — `custom_webhook_command`.
5. **Generic CLI command** — `custom_cli_command`.
6. **Cross-cutting settings** — verbosity, idle cooldown, reply listener.
7. **Disable all notifications** — set `notifications.enabled = false`.

## Step 3: Configure Native Platforms (Discord / Telegram / Slack)

Collect and validate platform-specific values, then write them under native keys:
- Discord webhook: `notifications.discord`
- Telegram: `notifications.telegram`
- Slack: `notifications.slack`

Example config shape:

```json
{
  "notifications": {
    "enabled": true,
    "verbosity": "session",
    "idleCooldownSeconds": 60,
    "discord": { "enabled": true, "webhookUrl": "https://discord.com/api/webhooks/..." },
    "telegram": { "enabled": false, "botToken": "", "chatId": "" },
    "slack": { "enabled": false, "webhookUrl": "" },
    "custom_webhook_command": { "enabled": false, "url": "", "method": "POST", "events": ["session-end"] },
    "custom_cli_command": { "enabled": false, "command": "", "events": ["session-end"] }
  }
}
```

## Step 4: Configure Generic Extensibility

### 4a) `custom_webhook_command`
Use AskUserQuestion to collect: URL, optional headers, optional method (`POST` default or `PUT`), optional event list (`session-end`, `ask-user-question`, `session-start`, `session-idle`, `stop`), optional instruction template.

### 4b) `custom_cli_command`
Use AskUserQuestion to collect: command template (supports `{{event}}`, `{{instruction}}`, `{{sessionId}}`, `{{projectPath}}`), optional event list, optional instruction template.

Write the resulting config with the Write tool (or `jq`) to `CONFIG_FILE`.

## Step 5: Cross-Cutting Settings

- **Verbosity** — `minimal` / `session` (recommended) / `agent` / `verbose`.
- **Idle cooldown** — `notifications.idleCooldownSeconds`.
- **Reply listener** — `notifications.reply.enabled` (if your external automation supports it).

## Step 6: Disable All Notifications

Set `notifications.enabled = false` in the config file.

## Step 7: Verification Guidance

After writing the config, tell the user how to validate it with their own sender, e.g.:

```bash
# POST a test payload to a configured webhook
curl -s -X POST "$WEBHOOK_URL" -H 'Content-Type: application/json' \
  -d '{"text":"WorkBuddy notification test"}'
```

Or, if using `custom_cli_command`, run the configured command manually once to confirm it executes.

## Final Summary Template

Show:
- Native platforms enabled (Discord / Telegram / Slack).
- Generic aliases enabled (`custom_webhook_command`, `custom_cli_command`).
- Verbosity + idle cooldown + reply-listener state.
- Config path (`.workbuddy/notifications.json` or `~/.workbuddy/notifications.json`).
