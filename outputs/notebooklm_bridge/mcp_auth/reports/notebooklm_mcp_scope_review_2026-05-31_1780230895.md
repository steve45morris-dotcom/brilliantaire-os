# NotebookLM MCP Scope Review

- **Scope Compilation Date:** 2026-05-31

## Expected Permissions Matrix
| Permission Area | Expected Scope | Min Privilege | Recommendation | Status |
|---|---|---|---|---|
| Notebook Access | `notebook.read` | Read-Only | Deny write permissions | Approved |
| Source Documents | `source.read` | Read-Only | Block manual source deletion | Approved |
| GCP Credentials | `iam.serviceAccounts.signBlob` | Sign-Only | Restrict to specific GCP project ID | Approved |
| Workspace Operations | `workspace.read` | Read-Only | Avoid folder modification scopes | Approved |

## Minimum Required Access Details
- **Scope Area:** Notebook and Source Pack read access
- **Minimum Required Access:** Read-Only access to matching notebook IDs
- **Risk Level:** Medium (restricted to read-only); High (if write scopes enabled)

## Security Rules
- **Avoid:** Write scopes (e.g. notebook.write, source.ingest, source.delete)
- **Recommendation:** Ensure Google GCP service account holds read-only IAM privileges for target resources.

## Manual Review Checklist
- [ ] Check that client credentials are local environment variables and never checked into Git.
- [ ] Verify that Google IAM roles are locked to 'Viewer' (Read-Only) for target cloud workspaces.
- [ ] Confirm that no OAuth tokens or client secrets are printed during runtime.
