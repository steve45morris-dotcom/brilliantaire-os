console.log(`
🧠 Local Inference Server - CLI Help
${'═'.repeat(50)}

  Tool:    Local Inference Server
  Type:    OpenAI-Compatible LLM Inference
  Mode:    manual-first (live calls disabled by default)
  Target:  Claude Code Integration
  Server:  http://localhost:20128/v1/chat/completions
  Model:   auto
  Auth:    zero credentials

${'─'.repeat(50)}

  COMMANDS:

  status
    Print bridge configuration, safety flags,
    output directory inventory, and integration
    status.

  health-check
    Verify the local inference server is running
    and responding. In manual-first mode, prints
    the curl command for manual verification.

  chat <MESSAGE>
    Stage a chat completion request as a local
    markdown file for review before execution.

  stage-prompt <SYSTEM_PROMPT> | <USER_MESSAGE>
    Stage a structured prompt with system and user
    messages. Use pipe (|) to separate them.

  mcp-config
    Generate the MCP configuration guide for
    installing this server in Claude Code locally.

  obsidian-export
    Stage an asset inventory summary for Obsidian
    export via the Approved Write Gateway.

${'─'.repeat(50)}

  EXAMPLES:

  npm run local-inference -- "status"
  npm run local-inference -- "health-check"
  npm run local-inference -- "chat What is the capital of France?"
  npm run local-inference -- "stage-prompt You are a coding assistant | Write a hello world in Python"
  npm run local-inference -- "mcp-config"
  npm run local-inference -- "obsidian-export"

${'─'.repeat(50)}

  SAFETY:
  - Live inference calls disabled by default
  - No autonomous inference execution
  - No external model downloads
  - All outputs are local markdown files
  - Manual prompt review required before execution
  - Response audit required after execution

${'─'.repeat(50)}

  MCP INSTALLATION (Local Machine):

  Add to ~/.claude/settings.json or .mcp.json:

  {
    "mcpServers": {
      "local-inference": {
        "command": "node",
        "args": ["dist/scripts/local-inference.js"],
        "env": {
          "LOCAL_INFERENCE_ENABLED": "true",
          "LOCAL_INFERENCE_URL": "http://localhost:20128"
        }
      }
    }
  }

${'─'.repeat(50)}

  CURL TEST COMMAND:

  curl http://localhost:20128/v1/chat/completions \\
    -H "Content-Type: application/json" \\
    -d '{"model":"auto","messages":[{"role":"user","content":"Hello!"}]}'

${'═'.repeat(50)}
`);
